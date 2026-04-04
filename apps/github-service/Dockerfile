FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
WORKDIR /app

FROM base AS builder
COPY . .
RUN pnpm install --no-frozen-lockfile
RUN pnpm run build --filter=@mono/github-service...

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache git


RUN corepack enable && corepack prepare pnpm@9.1.0 --activate

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 expressjs

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/github-service/package.json ./apps/github-service/
COPY packages ./packages

RUN pnpm install --prod --no-frozen-lockfile --filter=@mono/github-service...

COPY --from=builder --chown=expressjs:nodejs /app/apps/github-service/dist ./apps/github-service/dist
COPY --from=builder --chown=expressjs:nodejs /app/packages/db/dist ./packages/db/dist
COPY --from=builder --chown=expressjs:nodejs /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=expressjs:nodejs /app/packages/github/dist ./packages/github/dist


USER expressjs
EXPOSE 3002

CMD ["node", "apps/github-service/dist/index.js"]