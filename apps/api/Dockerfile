FROM node:25-alpine AS base
RUN npm install -g pnpm turbo

FROM base AS builder
WORKDIR /app
COPY . .
RUN turbo prune @gitify/api --docker

FROM base AS installer
WORKDIR /app
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm install --frozen-lockfile

COPY --from=builder /app/out/full/ .
RUN pnpm turbo run build --filter=@gitify/api...

FROM base AS prod-deps
WORKDIR /app
COPY --from=installer /app/apps/api/build ./
RUN pnpm install --prod

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 adonisjs
USER adonisjs

COPY --from=prod-deps --chown=adonisjs:nodejs /app ./

EXPOSE 80
CMD ["node", "./bin/server.js"]
