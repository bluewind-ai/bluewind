// app/db/schema.ts

import { pgTable, serial, integer, varchar, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { type AnyPgColumn } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const actions = pgTable("actions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull().unique(),
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
