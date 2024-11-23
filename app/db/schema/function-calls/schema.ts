// app/db/schema/function-calls/schema.ts

import { relations } from "drizzle-orm";
import {
  type AnyPgColumn,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  timestamp,
} from "drizzle-orm/pg-core";

import { objects } from "../objects/schema";
import { requests } from "../requests/schema";
import { serverFunctions } from "../server-functions/schema";
import { sessions } from "../sessions/schema";
import { users } from "../users/schema";

// Moving the enum and its pg definition here
export enum FunctionCallStatus {
  READY_FOR_APPROVAL = "READY_FOR_APPROVAL",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  RUNNING = "RUNNING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export const functionCallStatusEnum = pgEnum("function_call_status", [
  FunctionCallStatus.READY_FOR_APPROVAL,
  FunctionCallStatus.APPROVED,
  FunctionCallStatus.REJECTED,
  FunctionCallStatus.RUNNING,
  FunctionCallStatus.IN_PROGRESS,
  FunctionCallStatus.COMPLETED,
  FunctionCallStatus.FAILED,
]);

export const functionCalls = pgTable("function_calls", {
  id: serial("id").primaryKey(),
  serverFunctionId: integer("server_function_id")
    .references(() => serverFunctions.id, { onDelete: "cascade" })
    .notNull(),
  requestId: integer("request_id")
    .references(() => requests.id, { onDelete: "cascade" })
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
    fields: [functionCalls.parentId],
    references: [functionCalls.id],
  }),
  objects: many(objects),
  users: many(users),
  sessions: many(sessions),
}));
