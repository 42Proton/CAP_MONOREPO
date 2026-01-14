import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema/index';

const connectionString = process.env.DATABASE_URL!;

const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });

export const createMigrationClient = () => {
  const migrationClient = postgres(connectionString, { max: 1 });
  return drizzle(migrationClient, { schema });
};

export * from './schema/index';

export { and, eq, gt, gte, inArray, lt, lte, ne, not, or, sql } from 'drizzle-orm';
