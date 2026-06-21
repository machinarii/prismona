# Droplet / container deploy path for Prismona (alternative to DO App Platform,
# which deploys from git with no Dockerfile). Uses Next.js standalone output
# (output: "standalone" in next.config.mjs). See docs/MIGRATION-vercel-to-digitalocean.md.

FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# Standalone bundle ships its own minimal node_modules + server.js.
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
