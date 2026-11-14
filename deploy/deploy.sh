#!/usr/bin/env bash
# Push Prismona to the droplet and (re)build the container next to the
# self-hosted Postgres at /opt/postgres. Idempotent — safe to re-run.
#
#   HOST=root@209.38.149.21 deploy/deploy.sh
#   AUTH_SECRET=<existing value> HOST=... deploy/deploy.sh   # reuse a known secret
#
# First run generates /opt/prismona/.env (mode 600) with a fresh role password
# and AUTH_SECRET, and creates the `prismona` role + database inside the
# postgres container. Later runs leave both alone.
set -euo pipefail

HOST="${HOST:-root@209.38.149.21}"
DEST=/opt/prismona
PG_CONTAINER="${PG_CONTAINER:-postgres}"
DB_NAME="${DB_NAME:-prismona}"
DB_USER="${DB_USER:-prismona}"
REPO="$(cd "$(dirname "$0")/.." && pwd)"

echo ">> syncing $REPO -> $HOST:$DEST"
rsync -az --delete \
  --exclude .git --exclude node_modules --exclude .next --exclude out \
  --exclude .env --exclude .vercel --exclude .superpowers \
  --exclude '.do/app.local.yaml' --exclude '*.tsbuildinfo' --exclude .DS_Store \
  "$REPO/" "$HOST:$DEST/"

ssh "$HOST" \
  DB_NAME="$DB_NAME" DB_USER="$DB_USER" PG_CONTAINER="$PG_CONTAINER" \
  AUTH_SECRET="${AUTH_SECRET:-}" \
  bash -s <<'REMOTE'
set -euo pipefail
cd /opt/prismona

docker inspect "$PG_CONTAINER" >/dev/null 2>&1 \
  || { echo "ERROR: container '$PG_CONTAINER' not running - deploy /opt/postgres first" >&2; exit 1; }

# Admin role of the shared cluster, straight from its own env.
PG_ADMIN="$(docker inspect -f '{{range .Config.Env}}{{println .}}{{end}}' "$PG_CONTAINER" \
  | awk -F= '$1=="POSTGRES_USER"{print $2}')"
PG_ADMIN="${PG_ADMIN:-postgres}"
psql_admin() { docker exec "$PG_CONTAINER" psql -U "$PG_ADMIN" -d postgres "$@"; }

if [[ -f .env ]]; then
  echo ">> .env exists, keeping it"
  DB_PASS="$(sed -n 's|^DATABASE_URL=postgresql://[^:]*:\([^@]*\)@.*|\1|p' .env)"
  [[ -n "$DB_PASS" ]] || { echo "ERROR: cannot read the password out of .env DATABASE_URL" >&2; exit 1; }
else
  DB_PASS="$(openssl rand -base64 30 | tr -d '/+=' | cut -c1-32)"
  : "${AUTH_SECRET:=$(openssl rand -base64 32 | tr -d '\n')}"
  cat > .env <<EOF
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@$PG_CONTAINER:5432/$DB_NAME
DATABASE_SSL=off
AUTH_SECRET=$AUTH_SECRET
PRISMONA_BASE_URL=https://prismona.io
EOF
  chmod 600 .env
  echo ">> generated .env"
fi

# Dedicated role + database, so the nightly pg-backup picks them up on its own
# and nothing shares the cluster-wide `app` database.
if [[ -z "$(psql_admin -tAc "select 1 from pg_roles where rolname='$DB_USER'")" ]]; then
  psql_admin -c "create role \"$DB_USER\" login password '$DB_PASS'"
  echo ">> created role $DB_USER"
else
  psql_admin -c "alter role \"$DB_USER\" login password '$DB_PASS'"   # keep role and .env in sync
fi
if [[ -z "$(psql_admin -tAc "select 1 from pg_database where datname='$DB_NAME'")" ]]; then
  psql_admin -c "create database \"$DB_NAME\" owner \"$DB_USER\""
  echo ">> created database $DB_NAME"
fi

echo ">> building (this box is 1 vCPU / 2 GB - expect a few minutes)"
docker compose up -d --build

echo ">> waiting for health"
for _ in $(seq 1 40); do
  s="$(docker inspect -f '{{.State.Health.Status}}' prismona 2>/dev/null || echo starting)"
  [[ "$s" == healthy ]] && break
  [[ "$s" == unhealthy ]] && { docker compose logs --tail 40 web; exit 1; }
  sleep 5
done
docker compose ps
curl -fsS http://127.0.0.1:3000/api/health && echo
REMOTE
