FROM oven/bun:1 AS build
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/

RUN bun install --frozen-lockfile

COPY apps/web ./apps/web

WORKDIR /app/apps/web
RUN bun --bun run build

FROM oven/bun:1 AS production
WORKDIR /app

COPY --from=build /app/apps/web/.output /app

EXPOSE 80/tcp
ENTRYPOINT [ "bun", "--bun", "run", "/app/server/index.mjs" ]
