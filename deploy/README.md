# Deploying Prismona on the droplet

Prismona runs as a container on the same host as the **self-hosted Postgres**
(`/opt/postgres`, see that repo's brief). It joins that stack's compose network
and reaches the database at `postgres:5432`, so port 5432 stays bound to
`127.0.0.1` and is never published. This replaces the paid DigitalOcean Managed
Postgres cluster (`prismona-db`) and the App Platform deploy.

| Path on the droplet | Purpose |
|---|---|
| `/opt/prismona/` | this repo (rsynced, no `.git`) |
| `/opt/prismona/.env` | `DATABASE_URL`, `AUTH_SECRET`, `PRISMONA_BASE_URL` (mode 600) |
| `/opt/prismona/docker-compose.yml` | the `prismona` container, published on `127.0.0.1:3000` |
| `/opt/postgres/` | the Postgres stack it depends on |

## Prerequisites

The Postgres stack is already deployed and healthy:

```sh
ssh root@209.38.149.21 'docker ps --filter name=postgres; systemctl is-enabled pg-backup.timer'
```

## Deploy

```sh
HOST=root@209.38.149.21 deploy/deploy.sh
```

Idempotent. The first run generates `/opt/prismona/.env` with a fresh role
password and `AUTH_SECRET`, and creates the `prismona` role + database inside
the postgres container. Later runs keep both and just rebuild.

To carry over an existing `AUTH_SECRET` instead of generating one (keeps
already-issued recovery keys valid), pass it on the first run only:

```sh
AUTH_SECRET='<existing value>' HOST=root@209.38.149.21 deploy/deploy.sh
```

The image builds **on the droplet** — 1 vCPU / 2 GB shared with Joplin,
MariaDB and CloudPanel, so a build takes a few minutes and leans on swap. If it
ever OOMs, build for `linux/amd64` elsewhere and ship the image instead:

```sh
docker buildx build --platform linux/amd64 -t prismona:local --load .
docker save prismona:local | gzip | ssh root@209.38.149.21 'gunzip | docker load'
ssh root@209.38.149.21 'cd /opt/prismona && docker compose up -d --no-build'
```

## Publish it

nginx already owns 80/443 on this box via **CloudPanel**, so add the vhost with
`clpctl` rather than hand-editing `/etc/nginx/sites-enabled/` (CloudPanel
rewrites those):

```sh
clpctl site:add:reverse-proxy --domainName=prismona.io \
  --reverseProxyUrl='http://127.0.0.1:3000' \
  --siteUser=prismona --siteUserPassword='<password>'

# point DNS at 209.38.149.21 first, then:
clpctl lets-encrypt:install:certificate --domainName=prismona.io \
  --subjectAlternativeName=www.prismona.io
```

Leave `PRISMONA_BASE_URL` matching whatever hostname you publish on — the MCP
tools build their internal API calls from it.

## Backups

Nothing to configure. `pg-backup` discovers every running `postgres:*`
container and dumps **every** database it finds, so the `prismona` database is
picked up by the next nightly run. Verify:

```sh
ssh root@209.38.149.21 'pg-backup && ls /var/backups/postgres/postgres/*/ | tail'
```

Restore into a scratch database (never over the live one):

```sh
pg-restore postgres /var/backups/postgres/postgres/<stamp> prismona prismona_restored
```

## Operating

```sh
cd /opt/prismona
docker compose ps
docker compose logs -f web
curl -s localhost:3000/api/health          # {"ok":true,"storage":"ready"}
docker exec postgres psql -U admin -d prismona -c 'select count(*) from blobs'
```
