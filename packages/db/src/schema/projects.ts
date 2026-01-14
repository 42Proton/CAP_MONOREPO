import { integer, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { projectSourceEnum, projectStatusEnum } from './enums';
import { users } from './users';

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  sourceType: projectSourceEnum('source_type').notNull(),
  githubRepoUrl: varchar('github_repo_url', { length: 500 }),
  githubRepoFullName: varchar('github_repo_full_name', { length: 255 }),
  githubBranch: varchar('github_branch', { length: 255 }).default('main'),
  githubLastCommitSha: varchar('github_last_commit_sha', { length: 40 }),
  storagePath: varchar('storage_path', { length: 500 }),
  storageSize: integer('storage_size'),
  metadata: jsonb('metadata').$type<ProjectMetadata>(),
  status: projectStatusEnum('status').default('pending').notNull(),
  statusMessage: text('status_message'),
  lastAnalyzedAt: timestamp('last_analyzed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export interface ProjectMetadata {
  languages?: string[];
  frameworks?: string[];
  packageManagers?: string[];
  fileCount?: number;
  totalLines?: number;
  structure?: {
    hasTests?: boolean;
    hasDocker?: boolean;
    hasCi?: boolean;
    hasReadme?: boolean;
  };
}

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
