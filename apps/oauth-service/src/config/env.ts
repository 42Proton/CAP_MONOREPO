import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().url(),
  GITHUB_CLIENT_ID: z.string().min(1, "GITHUB_CLIENT_ID is required"),
  GITHUB_CLIENT_SECRET: z.string().min(1, "GITHUB_CLIENT_SECRET is required"),
  JWT_SECRET: z.string().default('a_very_secret_key_change_me_in_production'),
  GITHUB_CALLBACK_URL: z.string().url().optional().default('http://localhost:3001/auth/callback/github'),
  OPENAI_API_KEY: z.string().optional(),
  LANGCHAIN_API_KEY: z.string().optional(),
  LANGCHAIN_TRACING_V2: z.coerce.boolean().default(false),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
