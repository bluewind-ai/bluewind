// app/db/schema/function-calls/schema.ts
import { relations } from "drizzle-orm";
import { integer, jsonb, pgEnum, pgTable, serial, timestamp } from "drizzle-orm/pg-core";

import { objects } from "../objects/schema";
import { requests } from "../requests/schema";
import { serverFunctions } from "../server-functions/schema";
import { sessions } from "../sessions/schema";
import { users } from "../users/schema";
// First, define the enum VALUES (these will be used to create the type in postgres)
export const functionCallStatusEnum = pgEnum("function_call_status", [
  "READY_FOR_APPROVAL",
  "APPROVED",
  "REJECTED",
  "RUNNING",
  "IN_PROGRESS",
  "COMPLETED",
  "FAILED",
]);
// Then TypeScript enum for type checking
export enum FunctionCallStatus {
  READY_FOR_APPROVAL = "READY_FOR_APPROVAL",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  RUNNING = "RUNNING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}
export const functionCalls = pgTable("function_calls", {
  id: serial("id").primaryKey(),
  serverFunctionId: integer("server_function_id")
    .references(() => serverFunctions.id, { onDelete: "cascade" })
    .notNull(),
  requestId: integer("request_id")
    .references(() => requests.id, { onDelete: "cascade" })
    .notNull(),
  functionCallId: integer("function_call_id"),
  status: functionCallStatusEnum("status").notNull().default("READY_FOR_APPROVAL"),
  args: jsonb("args"),
  result: jsonb("result"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type FunctionCall = typeof functionCalls.$inferSelect & {
  serverFunction?: typeof serverFunctions.$inferSelect;
};
export const functionCallsRelations = relations(functionCalls, ({ one, many }) => ({
  request: one(requests, {
    fields: [functionCalls.requestId],
    references: [requests.id],
  }),
  serverFunction: one(serverFunctions, {
    fields: [functionCalls.serverFunctionId],
    references: [serverFunctions.id],
  }),
  parent: one(functionCalls, {
    fields: [functionCalls.functionCallId],
    references: [functionCalls.id],
  }),
  objects: many(objects),
  users: many(users),
  sessions: many(sessions),
}));
