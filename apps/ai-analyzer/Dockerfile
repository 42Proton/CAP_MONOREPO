FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
WORKDIR /app

FROM base AS builder
COPY . .
RUN pnpm install --no-frozen-lockfile
RUN pnpm run build --filter=@mono/ai-analyzer...

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@9.1.0 --activate

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 expressjs

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/ai-analyzer/package.json ./apps/ai-analyzer/
COPY packages ./packages

RUN pnpm install --prod --no-frozen-lockfile --filter=@mono/ai-analyzer...

COPY --from=builder --chown=expressjs:nodejs /app/apps/ai-analyzer/dist ./apps/ai-analyzer/dist
COPY --from=builder --chown=expressjs:nodejs /app/packages/db/dist ./packages/db/dist
COPY --from=builder --chown=expressjs:nodejs /app/packages/shared/dist ./packages/shared/dist
ENV LANGCHAIN_CALLBACKS_BACKGROUND=true


USER expressjs
EXPOSE 5001

CMD ["node", "apps/ai-analyzer/dist/index.js"]