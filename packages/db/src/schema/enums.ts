import { pgEnum } from 'drizzle-orm/pg-core';

// User roles
export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);

// Project source types
export const projectSourceEnum = pgEnum('project_source', ['github', 'upload']);

// Project status
export const projectStatusEnum = pgEnum('project_status', [
  'pending',
  'cloning',
  'cloned',
  'analyzing',
  'ready',
  'error',
]);

// Analysis session status
export const analysisStatusEnum = pgEnum('analysis_status', [
  'queued',
  'running',
  'completed',
  'failed',
  'cancelled',
]);

// Workflow types
export const workflowTypeEnum = pgEnum('workflow_type', [
  'full_review',
  'quick_check',
  'security_only',
  'best_practices',
  'custom',
]);

// Analysis step status
export const stepStatusEnum = pgEnum('step_status', [
  'pending',
  'running',
  'completed',
  'failed',
  'skipped',
]);

// Finding severity levels
export const findingSeverityEnum = pgEnum('finding_severity', [
  'critical',
  'major',
  'minor',
  'info',
]);

// Finding categories
export const findingCategoryEnum = pgEnum('finding_category', [
  'security',
  'performance',
  'style',
  'best_practice',
  'bug',
  'maintainability',
]);

// Report formats
export const reportFormatEnum = pgEnum('report_format', ['json', 'markdown', 'pdf', 'html']);

// GitHub App installation account types
export const githubAccountTypeEnum = pgEnum('github_account_type', ['organization', 'user']);

// GitHub repository selection scope
export const repositorySelectionEnum = pgEnum('repository_selection', ['all', 'selected']);
