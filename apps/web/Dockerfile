FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS build
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile --filter=@gitify/web...

COPY apps/api/app/models ./apps/api/app/models
COPY apps/api/tsconfig.json ./apps/api/tsconfig.json
COPY apps/web ./apps/web

WORKDIR /app/apps/web

ENV NODE_ENV=production
ENV NITRO_PRESET=node-server

RUN pnpm run build

FROM base AS production
WORKDIR /app

COPY --from=build /app/apps/web/.output /app

EXPOSE 80

ENTRYPOINT ["node", "/app/server/index.mjs"]
