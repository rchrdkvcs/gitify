FROM oven/bun:1-alpine AS base
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN bun install --frozen-lockfile

COPY apps/api ./apps/api

WORKDIR /app/apps/api
RUN node ace build --ignore-ts-errors

FROM oven/bun:1-alpine AS production
WORKDIR /app

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/api/build ./

EXPOSE 80
CMD ["bun", "run", "./bin/server.js"]
