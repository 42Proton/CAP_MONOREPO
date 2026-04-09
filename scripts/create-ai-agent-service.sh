#!/usr/bin/env bash
set -euo pipefail

# ─── Create a new AI Agent Microservice (Gemini + LangChain) ───
# Usage: ./scripts/create-ai-agent-service.sh <service-name>

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SERVICE_NAME="${1:-ai-agent-service}"
SERVICE_DIR="$REPO_ROOT/apps/$SERVICE_NAME"

mkdir -p "$SERVICE_DIR/src/config"
mkdir -p "$SERVICE_DIR/src/middleware"
mkdir -p "$SERVICE_DIR/src/routes"
mkdir -p "$SERVICE_DIR/src/agents"

cat > "$SERVICE_DIR/package.json" <<EOF
{
  "name": "@mono/$SERVICE_NAME",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "express": "^4.18.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "helmet": "^7.1.0",
    "zod": "^3.22.4",
    "langchain": "^0.1.0",
    "@langchain/google-genai": "^0.0.10",
    "@mono/shared": "workspace:*",
    "@mono/db": "workspace:*"
  }
}
EOF

cat > "$SERVICE_DIR/src/agents/main-agent.ts" <<EOF
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { env } from '../config/env.js';

const model = new ChatGoogleGenerativeAI({
  modelName: "gemini-1.5-flash",
  apiKey: env.GOOGLE_API_KEY,
});

export const analyzeCodeSnippet = async (code: string) => {
  const prompt = \`You are a professional code reviewer. 
  Please analyze the following code snippet for:
  1. Potential bugs.
  2. Performance bottlenecks.
  3. Security vulnerabilities.
  4. Suggestions for improvement.

  Code Snippet:
  \${code}\`;

  const response = await model.invoke(prompt);
  return response.content;
};
EOF

cat > "$SERVICE_DIR/src/routes/ai.ts" <<EOF
import { Router } from 'express';
import { analyzeCodeSnippet } from '../agents/main-agent.js';
import { successResponse } from '@mono/shared';

const router = Router();

router.post('/analyze', async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      throw new Error("No code provided for analysis");
    }
    
    const analysis = await analyzeCodeSnippet(code);
    
    res.json(
      successResponse({
        analysis: analysis,
        timestamp: new Date().toISOString()
      })
    );
  } catch (error) {
    next(error);
  }
});

export { router as aiRouter };
EOF

cat > "$SERVICE_DIR/src/app.ts" <<EOF
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { aiRouter } from './routes/ai.js';
import { errorHandler } from './middleware/error-handler.js';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/ai', aiRouter);

app.use(errorHandler);

export default app;
EOF
