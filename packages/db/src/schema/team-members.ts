import { pgTable, timestamp, uuid , text} from 'drizzle-orm/pg-core';
import { teams } from './teams';
import { users } from './users';
import { teamRoleEnum } from './enums';

export const teamMembers = pgTable('team_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: teamRoleEnum('role').default('developer').notNull(),
  status: text('status').$type<'pending' | 'active'>().default('pending').notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});