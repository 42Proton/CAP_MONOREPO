import { integer, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { analysisSessions } from './analysis-sessions';
import { stepStatusEnum } from './enums';

export const analysisSteps = pgTable('analysis_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => analysisSessions.id, { onDelete: 'cascade' }),
  stepName: varchar('step_name', { length: 100 }).notNull(),
  stepOrder: integer('step_order').notNull(),
  status: stepStatusEnum('status').default('pending').notNull(),
  inputData: jsonb('input_data').$type<Record<string, unknown>>(),
  outputData: jsonb('output_data').$type<Record<string, unknown>>(),
  errorMessage: text('error_message'),
  errorStack: text('error_stack'),
  retryCount: integer('retry_count').default(0),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type AnalysisStep = typeof analysisSteps.$inferSelect;
export type NewAnalysisStep = typeof analysisSteps.$inferInsert;
