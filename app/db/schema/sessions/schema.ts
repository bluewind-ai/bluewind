// app/db/schema/sessions/schema.ts

import { pgTable, serial, integer, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { functionCalls } from "../function-calls/schema";
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
  functionCallId: integer("function_call_id")
    .references(() => functionCalls.id, { onDelete: "cascade" })
    .notNull(),
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
  functionCall: one(functionCalls, {
    fields: [sessions.functionCallId],
    references: [functionCalls.id],
  }),
}));
