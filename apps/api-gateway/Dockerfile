# Base Node.js Dockerfile for TypeScript services
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate

# Dependencies stage
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY packages/github/package.json ./packages/github/
COPY apps/api-gateway/package.json ./apps/api-gateway/
RUN pnpm install --frozen-lockfile

# Builder stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app ./
COPY . .
RUN find . -name "*.tsbuildinfo" -delete
RUN pnpm run build --filter=@mono/api-gateway...

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 expressjs

COPY --from=builder --chown=expressjs:nodejs /app/apps/api-gateway/dist ./dist
COPY --from=builder --chown=expressjs:nodejs /app/apps/api-gateway/package.json ./
COPY --from=builder --chown=expressjs:nodejs /app/node_modules ./node_modules

USER expressjs
EXPOSE 3000
CMD ["node", "dist/index.js"]
