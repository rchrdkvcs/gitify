FROM node:25-alpine AS base
RUN npm install -g pnpm turbo

FROM base AS builder
WORKDIR /app
COPY . .
RUN turbo prune @gitify/web --docker

FROM base AS installer
WORKDIR /app
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm install --frozen-lockfile

COPY --from=builder /app/out/full/ .
ENV NODE_ENV=production
ENV NITRO_PRESET=node-server
RUN pnpm turbo run build --filter=@gitify/web...

FROM base AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nuxtjs
USER nuxtjs

COPY --from=installer --chown=nuxtjs:nodejs /app/apps/web/.output /app

EXPOSE 80
ENTRYPOINT ["node", "/app/server/index.mjs"]
