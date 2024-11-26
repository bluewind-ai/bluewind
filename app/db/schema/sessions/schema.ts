// app/db/schema/sessions/schema.ts
import { relations } from "drizzle-orm";
import { integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

import { requests } from "../requests/schema";
import { users } from "../users/schema";

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  sessionToken: text("session_token").notNull().unique(),
  csrfToken: text("csrf_token").notNull(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  messages: jsonb("messages").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  requestId: integer("request_id")
    .references(() => requests.id, { onDelete: "cascade" })
    .notNull(),
});
export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),

  request: one(requests, {
    fields: [sessions.requestId],
    references: [requests.id],
  }),
}));
