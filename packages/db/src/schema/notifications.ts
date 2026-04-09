import { pgTable, uuid, text, varchar, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users'; 

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), 
  title: text('title').notNull(),
  message: text('message').notNull(),
  link: text('link'), 
  metadata: jsonb('metadata'), 
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});