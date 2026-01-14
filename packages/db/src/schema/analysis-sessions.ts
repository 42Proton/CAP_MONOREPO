import { jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { analysisStatusEnum, workflowTypeEnum } from './enums';
import { projects } from './projects';

export const analysisSessions = pgTable('analysis_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  workflowType: workflowTypeEnum('workflow_type').default('full_review').notNull(),
  workflowConfig: jsonb('workflow_config').$type<WorkflowConfig>(),
  status: analysisStatusEnum('status').default('queued').notNull(),
  statusMessage: text('status_message'),
  triggeredBy: uuid('triggered_by'),
  commitSha: varchar('commit_sha', { length: 40 }),
  summary: jsonb('summary').$type<AnalysisSummary>(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export interface WorkflowConfig {
  steps?: string[];
  skipSteps?: string[];
  options?: Record<string, unknown>;
}

export interface AnalysisSummary {
  totalFindings: number;
  bySeverity: {
    critical: number;
    major: number;
    minor: number;
    info: number;
  };
  byCategory: Record<string, number>;
  filesAnalyzed: number;
  linesAnalyzed: number;
  duration: number;
}

export type AnalysisSession = typeof analysisSessions.$inferSelect;
export type NewAnalysisSession = typeof analysisSessions.$inferInsert;
