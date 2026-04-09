import { relations } from 'drizzle-orm';

import { analysisSessions } from './analysis-sessions';
import { analysisSteps } from './analysis-steps';
import { findings } from './findings';
import { projects } from './projects';
import { reports } from './reports';
import { users } from './users';
import { teams } from './teams';
import { teamMembers } from './team-members';
import { notifications } from './notifications'; 


export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects), 
  teamMemberships: many(teamMembers),
  ownedTeams: many(teams), 
  notifications: many(notifications),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  team: one(teams, { 
    fields: [projects.teamId],
    references: [teams.id],
  }),
  analysisSessions: many(analysisSessions), 
}));


export const teamsRelations = relations(teams, ({ one, many }) => ({
  admin: one(users, {
    fields: [teams.adminId],
    references: [users.id],
  }),
  members: many(teamMembers),
  projects: many(projects), 
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
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