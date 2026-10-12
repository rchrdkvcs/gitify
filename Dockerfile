FROM node:24-alpine AS builder
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:24-alpine AS production
RUN corepack enable
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3333
COPY --from=builder /app/build ./
RUN pnpm install --prod --frozen-lockfile
USER node
EXPOSE 3333
CMD ["node", "bin/server.js"]
