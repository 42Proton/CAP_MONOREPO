import { jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { analysisSessions } from './analysis-sessions';
import { reportFormatEnum } from './enums';

export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => analysisSessions.id, { onDelete: 'cascade' }),
  format: reportFormatEnum('format').notNull(),
  title: varchar('title', { length: 255 }),
  storageUrl: varchar('storage_url', { length: 500 }),
  summary: jsonb('summary').$type<ReportSummary>(),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export interface ReportSummary {
  totalFindings: number;
  criticalCount: number;
  majorCount: number;
  healthScore: number; // 0-100
  topIssues: string[];
}

export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
