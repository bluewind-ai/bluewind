// app/db/schema/function-calls/schema.ts
import { relations } from "drizzle-orm";
import { type AnyPgColumn, integer, jsonb, pgTable, serial, timestamp } from "drizzle-orm/pg-core";

import { apps } from "../apps/schema";
import { debugLogs } from "../debug-logs/schema";
import { functionCallStatusEnum } from "../enums";
import { objects } from "../objects/schema";
import { requestErrors } from "../request-errors/schema";
import { serverFunctions } from "../server-functions/schema";
import { sessions } from "../sessions/schema";
import { FunctionCallStatus } from "../types";
import { users } from "../users/schema";

export const functionCalls = pgTable("function_calls", {
  id: serial("id").primaryKey(),
  actionId: integer("action_id")
    .references(() => serverFunctions.id, { onDelete: "cascade" })
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
  action?: typeof serverFunctions.$inferSelect;
};
export const functionCallsRelations = relations(functionCalls, ({ one, many }) => ({
  action: one(serverFunctions, {
    fields: [functionCalls.actionId],
    references: [serverFunctions.id],
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
