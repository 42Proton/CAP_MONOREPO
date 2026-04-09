FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
WORKDIR /app

FROM base AS builder
COPY . .
RUN pnpm install --no-frozen-lockfile
RUN pnpm run build --filter=@mono/notification-service...

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@9.1.0 --activate

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 expressjs

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/notification-service/package.json ./apps/notification-service/
COPY packages ./packages

RUN pnpm install --prod --no-frozen-lockfile --filter=@mono/notification-service...

COPY --from=builder --chown=expressjs:nodejs /app/apps/notification-service/dist ./apps/notification-service/dist
COPY --from=builder --chown=expressjs:nodejs /app/packages/db/dist ./packages/db/dist
COPY --from=builder --chown=expressjs:nodejs /app/packages/shared/dist ./packages/shared/dist

USER expressjs
EXPOSE 8085

CMD ["node", "apps/notification-service/dist/index.js"]