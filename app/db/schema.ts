// app/db/schema.ts

import { pgTable, serial, integer, varchar, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { type AnyPgColumn } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  sessionToken: text("session_token").notNull().unique(), // for authentication
  csrfToken: text("csrf_token").notNull(), // for CSRF protection
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  messages: jsonb("messages").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const actions = pgTable("actions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull().unique(),
  type: varchar("type", { length: 50 }).notNull(),
});

export type Action = typeof actions.$inferSelect & {
  displayName: string;
};

export function enrichAction(action: typeof actions.$inferSelect): Action {
  return {
    ...action,
    displayName: action.name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
  };
}

export const actionCalls = pgTable("action_calls", {
  id: serial("id").primaryKey(),
  actionId: integer("action_id")
    .references(() => actions.id, { onDelete: "cascade" })
    .notNull(),
  parentId: integer("parent_id").references((): AnyPgColumn => actionCalls.id, {
    onDelete: "cascade",
  }),
  status: varchar("status", { length: 256 }).notNull().default("ready_for_approval"),
  args: jsonb("args"),
  result: jsonb("result"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
}));

export const actionCallsRelations = relations(actionCalls, ({ one }) => ({
  action: one(actions, {
    fields: [actionCalls.actionId],
    references: [actions.id],
  }),
  parent: one(actionCalls, {
    fields: [actionCalls.parentId],
    references: [actionCalls.id],
  }),
}));

export const actionsRelations = relations(actions, ({ many }) => ({
  calls: many(actionCalls),
}));

export const requestErrors = pgTable("request_errors", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  method: varchar("method", { length: 10 }).notNull(),
  url: text("url").notNull(),
  headers: jsonb("headers").$type<Record<string, string>>(),
  body: text("body"),
  stack: text("stack"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const debugLogs = pgTable("debug_logs", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ActionCallStatus = "ready_for_approval" | "running" | "completed";
