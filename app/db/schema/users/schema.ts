// app/db/schema/users/schema.ts

import { pgTable, serial, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { functionCalls } from "../function-calls/schema";
import { sessions } from "../sessions/schema";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  functionCallId: integer("function_call_id")
    .references(() => functionCalls.id, { onDelete: "cascade" })
    .notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  sessions: many(sessions),
  functionCall: one(functionCalls, {
    fields: [users.functionCallId],
    references: [functionCalls.id],
  }),
}));
