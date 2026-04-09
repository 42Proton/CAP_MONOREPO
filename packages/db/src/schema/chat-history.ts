import { pgTable, serial, text, jsonb, timestamp, index } from "drizzle-orm/pg-core";

export const codeReviewsHistory = pgTable("code_reviews_history", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  message: jsonb("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    sessionIdIdx: index("idx_session_id").on(table.sessionId),
  };
});