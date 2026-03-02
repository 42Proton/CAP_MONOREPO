FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY packages/github/package.json ./packages/github/
COPY apps/oauth-service/package.json ./apps/oauth-service/
RUN pnpm install --frozen-lockfile


FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN rm -rf apps/oauth-service/dist
RUN pnpm run build --filter=@mono/oauth-service...

RUN pnpm run build --filter=@mono/oauth-service...

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN mkdir -p apps/oauth-service packages/shared packages/db packages/github
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 expressjs

COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/oauth-service/package.json ./apps/oauth-service/
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/db/package.json ./packages/db/
COPY --from=builder /app/packages/github/package.json ./packages/github/

RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder --chown=expressjs:nodejs /app/apps/oauth-service/dist ./apps/oauth-service/dist
COPY --from=builder --chown=expressjs:nodejs /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=expressjs:nodejs /app/packages/db/dist ./packages/db/dist
COPY --from=builder --chown=expressjs:nodejs /app/packages/github/dist ./packages/github/dist

COPY --from=builder --chown=expressjs:nodejs /app/apps/oauth-service/.env ./apps/oauth-service/.env

USER expressjs
EXPOSE 3001

CMD ["node", "apps/oauth-service/dist/index.js"]