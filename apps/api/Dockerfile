FROM node:24-alpine AS base
WORKDIR /app

FROM base AS deps
RUN npm install -g pnpm@latest
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile --filter=@gitify/api...

FROM base AS build
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/apps/api/node_modules /app/apps/api/node_modules
COPY pnpm-workspace.yaml package.json ./
COPY apps/api ./apps/api
WORKDIR /app/apps/api
RUN node ace build --ignore-ts-errors

FROM base AS production
RUN npm install -g pnpm@latest
COPY --from=build /app/apps/api/build ./
RUN pnpm install --prod
EXPOSE 80
CMD ["node", "./bin/server.js"]
