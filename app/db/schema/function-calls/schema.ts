// app/db/schema/function-calls/schema.ts

import { pgTable, serial, integer, jsonb, timestamp, type AnyPgColumn } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { actions } from "../actions/schema";
import { objects } from "../objects/schema";
import { apps } from "../apps/schema";
import { users } from "../users/schema";
import { sessions } from "../sessions/schema";
import { requestErrors } from "../request-errors/schema";
import { debugLogs } from "../debug-logs/schema";
import { functionCallStatusEnum } from "../enums";
import { FunctionCallStatus } from "../types";

export const functionCalls = pgTable("function_calls", {
  id: serial("id").primaryKey(),
  actionId: integer("action_id")
    .references(() => actions.id, { onDelete: "cascade" })
    .notNull(),
  parentId: integer("parent_id").references((): AnyPgColumn => functionCalls.id, {
    onDelete: "cascade",
  }),
  status: functionCallStatusEnum("status").notNull().default(FunctionCallStatus.READY_FOR_APPROVAL),
  args: jsonb("args"),
  result: jsonb("result"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type FunctionCall = typeof functionCalls.$inferSelect & {
  action?: typeof actions.$inferSelect;
};

export const functionCallsRelations = relations(functionCalls, ({ one, many }) => ({
  action: one(actions, {
    fields: [functionCalls.actionId],
    references: [actions.id],
  }),
  parent: one(functionCalls, {
    fields: [functionCalls.parentId],
    references: [functionCalls.id],
  }),
  objects: many(objects),
  apps: many(apps),
  users: many(users),
  sessions: many(sessions),
  requestErrors: many(requestErrors),
  debugLogs: many(debugLogs),
}));
