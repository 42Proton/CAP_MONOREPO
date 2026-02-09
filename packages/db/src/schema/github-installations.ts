import { integer, jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { githubAccountTypeEnum, repositorySelectionEnum } from './enums';

export const githubInstallations = pgTable('github_installations', {
  id: uuid('id').primaryKey().defaultRandom(),
  installationId: integer('installation_id').notNull().unique(),
  accountType: githubAccountTypeEnum('account_type').notNull(),
  accountLogin: varchar('account_login', { length: 255 }).notNull(),
  accountId: integer('account_id').notNull(),
  permissions: jsonb('permissions').$type<Record<string, string>>(),
  repositorySelection: repositorySelectionEnum('repository_selection').notNull(),
  suspendedAt: timestamp('suspended_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type GitHubInstallation = typeof githubInstallations.$inferSelect;
export type NewGitHubInstallation = typeof githubInstallations.$inferInsert;
