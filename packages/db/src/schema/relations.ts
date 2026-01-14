import { relations } from 'drizzle-orm';

import { analysisSessions } from './analysis-sessions';
import { analysisSteps } from './analysis-steps';
import { findings } from './findings';
import { projects } from './projects';
import { reports } from './reports';
import { users } from './users';

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  analysisSessions: many(analysisSessions),
}));

export const analysisSessionsRelations = relations(analysisSessions, ({ one, many }) => ({
  project: one(projects, {
    fields: [analysisSessions.projectId],
    references: [projects.id],
  }),
  steps: many(analysisSteps),
  findings: many(findings),
  reports: many(reports),
}));

export const analysisStepsRelations = relations(analysisSteps, ({ one }) => ({
  session: one(analysisSessions, {
    fields: [analysisSteps.sessionId],
    references: [analysisSessions.id],
  }),
}));

export const findingsRelations = relations(findings, ({ one }) => ({
  session: one(analysisSessions, {
    fields: [findings.sessionId],
    references: [analysisSessions.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  session: one(analysisSessions, {
    fields: [reports.sessionId],
    references: [analysisSessions.id],
  }),
}));
