// app/db/schema/users/schema.ts

import { relations } from "drizzle-orm";
import { integer, pgTable, serial } from "drizzle-orm/pg-core";

import { functionCalls } from "../function-calls/schema";
import { requests } from "../requests/schema";
import { sessions } from "../sessions/schema";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  functionCallId: integer("function_call_id")
    .references(() => functionCalls.id, { onDelete: "cascade" })
    .notNull(),
  requestId: integer("request_id")
    .references(() => requests.id, { onDelete: "cascade" })
    .notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  sessions: many(sessions),
  functionCall: one(functionCalls, {
    fields: [users.functionCallId],
    references: [functionCalls.id],
  }),
  request: one(requests, {
    fields: [users.requestId],
    references: [requests.id],
  }),
}));
