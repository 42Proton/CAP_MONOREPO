import { z } from 'zod';

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  TEAM_PORT: z.coerce.number().default(3001),
  GITHUB_SERVICE_PORT: z.coerce.number().default(3002),
  DATABASE_URL: z.string().url(),
  GITHUB_CLIENT_ID: z.string().min(1, "GITHUB_CLIENT_ID is required"),
  GITHUB_CLIENT_SECRET: z.string().min(1, "GITHUB_CLIENT_SECRET is required"),
  JWT_SECRET: z.string().default('a_very_secret_key_change_me_in_production'),
  GITHUB_APP_ID: z.string().min(1, "GITHUB_APP_ID is required"),
  GITHUB_APP_PRIVATE_KEY: z.string().optional(),
  GITHUB_API_URL: z.string().url().default('https://api.github.com'),
  APP_URL: z.string().url(),
  MINIO_ENDPOINT: z.string().url().default('http://minio:9000'),
  MINIO_ACCESS_KEY: z.string().min(1, "MinIO Access Key is required"),
  MINIO_SECRET_KEY: z.string().min(1, "MinIO Secret Key is required"),

});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
