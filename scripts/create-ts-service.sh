#!/usr/bin/env bash
set -euo pipefail

# ─── Create a new TypeScript microservice (Express) ───
# Usage: ./scripts/create-ts-service.sh <service-name>
# Example: ./scripts/create-ts-service.sh user-service

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SERVICE_NAME="${1:-}"

if [ -z "$SERVICE_NAME" ]; then
  echo "Usage: $0 <service-name>"
  echo "Example: $0 user-service"
  exit 1
fi

SERVICE_DIR="$REPO_ROOT/apps/$SERVICE_NAME"

if [ -d "$SERVICE_DIR" ]; then
  echo "Error: Directory apps/$SERVICE_NAME already exists."
  exit 1
fi

# Prompt for port
read -rp "Port number (default 3001): " PORT
PORT="${PORT:-3001}"

echo "Creating TypeScript service: $SERVICE_NAME (port $PORT)"
echo "───────────────────────────────────────────────────"

# Create directory structure
mkdir -p "$SERVICE_DIR/src/config"
mkdir -p "$SERVICE_DIR/src/middleware"
mkdir -p "$SERVICE_DIR/src/routes"

# ─── package.json ───
cat > "$SERVICE_DIR/package.json" <<EOF
{
  "name": "@mono/$SERVICE_NAME",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "build": "tsc",
    "clean": "rm -rf dist",
    "dev": "tsx watch src/index.ts",
    "lint": "eslint src/",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@langchain/core": "^0.2.0",
    "@langchain/langgraph": "^0.0.28",
    "@langchain/openai": "^0.1.0",
    "@mono/db": "workspace:*",
    "@mono/shared": "workspace:*",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.18.3",
    "helmet": "^7.1.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@mono/eslint-config": "workspace:*",
    "@mono/typescript-config": "workspace:*",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.12",
    "@types/node": "^20.11.0",
    "@types/supertest": "^6.0.2",
    "jest": "^29.7.0",
    "supertest": "^6.3.4",
    "ts-jest": "^29.1.2",
    "tsx": "^4.7.1",
    "typescript": "^5.3.3"
  }
}
EOF

# ─── tsconfig.json ───
cat > "$SERVICE_DIR/tsconfig.json" <<'EOF'
{
  "extends": "@mono/typescript-config/node.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
EOF

# ─── tsconfig.test.json ───
cat > "$SERVICE_DIR/tsconfig.test.json" <<'EOF'
{
  "extends": "@mono/typescript-config/node.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "types": ["jest", "node"]
  },
  "include": ["src/**/*.test.ts"],
  "exclude": ["node_modules", "dist"]
}
EOF

# ─── jest.config.js ───
cat > "$SERVICE_DIR/jest.config.js" <<'EOF'
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json',
      },
    ],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@mono/shared$': '<rootDir>/../../packages/shared/src/index.ts',
    '^@mono/db$': '<rootDir>/../../packages/db/src/index.ts',
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.test.ts'],
  coverageDirectory: 'coverage',
  verbose: true,
};
EOF

# ─── .eslintrc.cjs ───
cat > "$SERVICE_DIR/.eslintrc.cjs" <<'EOF'
module.exports = {
  extends: ['@mono/eslint-config/node'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
EOF

# ─── Dockerfile ───
cat > "$SERVICE_DIR/Dockerfile" <<EOF
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
COPY apps/$SERVICE_NAME/package.json ./apps/$SERVICE_NAME/
RUN pnpm install --frozen-lockfile

# Builder stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/typescript-config/node_modules ./packages/typescript-config/node_modules
COPY --from=deps /app/packages/eslint-config/node_modules ./packages/eslint-config/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps /app/apps/$SERVICE_NAME/node_modules ./apps/$SERVICE_NAME/node_modules
COPY . .
RUN pnpm run build --filter=@mono/$SERVICE_NAME...

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \\
    adduser --system --uid 1001 expressjs

COPY --from=builder --chown=expressjs:nodejs /app/apps/$SERVICE_NAME/dist ./dist
COPY --from=builder --chown=expressjs:nodejs /app/apps/$SERVICE_NAME/package.json ./
COPY --from=builder --chown=expressjs:nodejs /app/node_modules ./node_modules

USER expressjs
EXPOSE $PORT
CMD ["node", "dist/index.js"]
EOF

# ─── src/index.ts ───
cat > "$SERVICE_DIR/src/index.ts" <<EOF
import 'dotenv/config';

import app from './app';
import { env } from './config/env.js';

const port = env.PORT;

app.listen(port, () => {
  console.info(\`$SERVICE_NAME running on http://localhost:\${port}\`);
  console.info(\`Environment: \${env.NODE_ENV}\`);
});
EOF

# ─── src/app.ts ───
cat > "$SERVICE_DIR/src/app.ts" <<'EOF'
import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';

import { errorHandler } from './middleware/error-handler.js';
import { healthRouter } from './routes/health.js';

const app: Express = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/health', healthRouter);

// Error handling
app.use(errorHandler);

export default app;
EOF

# ─── src/config/env.ts ───
cat > "$SERVICE_DIR/src/config/env.ts" <<EOF
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default($PORT),
  DATABASE_URL: z.string().url(),
  OPENAI_API_KEY: z.string().optional(),
  LANGCHAIN_API_KEY: z.string().optional(),
  LANGCHAIN_TRACING_V2: z.coerce.boolean().default(false),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
EOF

# ─── src/middleware/error-handler.ts ───
cat > "$SERVICE_DIR/src/middleware/error-handler.ts" <<'EOF'
import type { NextFunction, Request, Response } from 'express';

import { errorResponse, HTTP_STATUS } from '@mono/shared';

export interface AppError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = err.message || 'Internal Server Error';

  console.error(`[Error] ${statusCode}: ${message}`, err.stack);

  res.status(statusCode).json(errorResponse(message));
}
EOF

# ─── src/routes/health.ts ───
cat > "$SERVICE_DIR/src/routes/health.ts" <<EOF
import { Router } from 'express';

import { successResponse } from '@mono/shared';

const router = Router();

router.get('/', (_req, res) => {
  res.json(
    successResponse({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: '$SERVICE_NAME',
    })
  );
});

router.get('/ready', (_req, res) => {
  // Add database connectivity check here
  res.json(
    successResponse({
      status: 'ready',
      timestamp: new Date().toISOString(),
    })
  );
});

export { router as healthRouter };
EOF

# ─── src/routes/health.test.ts ───
cat > "$SERVICE_DIR/src/routes/health.test.ts" <<EOF
import request from 'supertest';

import app from '../app';

describe('Health Routes', () => {
  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.service).toBe('$SERVICE_NAME');
    });
  });

  describe('GET /health/ready', () => {
    it('should return ready status', async () => {
      const response = await request(app).get('/health/ready');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('ready');
    });
  });
});
EOF

echo ""
echo "TypeScript service '$SERVICE_NAME' created at apps/$SERVICE_NAME/"
echo ""
echo "Next steps:"
echo "  1. Run 'pnpm install' from the repo root"
echo "  2. Run 'pnpm --filter @mono/$SERVICE_NAME dev' to start developing"
echo ""
