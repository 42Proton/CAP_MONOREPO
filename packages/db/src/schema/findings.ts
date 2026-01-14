import { integer, pgTable, real, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { analysisSessions } from './analysis-sessions';
import { findingCategoryEnum, findingSeverityEnum } from './enums';

export const findings = pgTable('findings', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => analysisSessions.id, { onDelete: 'cascade' }),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  lineStart: integer('line_start'),
  lineEnd: integer('line_end'),
  columnStart: integer('column_start'),
  columnEnd: integer('column_end'),
  severity: findingSeverityEnum('severity').notNull(),
  category: findingCategoryEnum('category').notNull(),
  ruleId: varchar('rule_id', { length: 100 }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  suggestion: text('suggestion'),
  codeSnippet: text('code_snippet'),
  suggestedFix: text('suggested_fix'),
  aiGenerated: integer('ai_generated').default(0),
  aiConfidence: real('ai_confidence'),
  aiModel: varchar('ai_model', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Finding = typeof findings.$inferSelect;
export type NewFinding = typeof findings.$inferInsert;
