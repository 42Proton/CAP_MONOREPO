# 1. المرحلة الأساسية
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
WORKDIR /app

# 2. مرحلة البناء
FROM base AS builder
COPY . .
RUN pnpm install --no-frozen-lockfile
RUN pnpm run build --filter=@mono/ai-analyzer...

# 3. مرحلة التشغيل (تحسين الصلاحيات والسرعة)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# نحتاج pnpm هنا أيضاً لضمان تثبيت صحيح للمكتبات
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 expressjs

# نسخ ملفات الإعدادات والاعتمادات
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/ai-analyzer/package.json ./apps/ai-analyzer/
COPY packages ./packages

# التثبيت الفعلي للمكتبات المطلوبة للتشغيل فقط (--prod)
# هذا السطر سيضمن وجود dotenv وكل ما يلزم في مكانه الصحيح
RUN pnpm install --prod --no-frozen-lockfile --filter=@mono/ai-analyzer...

# نسخ ملفات الجافا سكريبت المبنية من مرحلة builder
COPY --from=builder --chown=expressjs:nodejs /app/apps/ai-analyzer/dist ./apps/ai-analyzer/dist
COPY --from=builder --chown=expressjs:nodejs /app/.env ./apps/ai-analyzer/.env
# بعد سطر تثبيت المكتبات وقبل سطر USER
COPY --from=builder --chown=expressjs:nodejs /app/packages/db/dist ./packages/db/dist
COPY --from=builder --chown=expressjs:nodejs /app/packages/shared/dist ./packages/shared/dist
ENV LANGCHAIN_CALLBACKS_BACKGROUND=true


USER expressjs
EXPOSE 5001

CMD ["node", "apps/ai-analyzer/dist/index.js"]