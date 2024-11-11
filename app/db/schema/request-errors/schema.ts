// app/db/schema/request-errors/schema.ts

import { pgTable, serial, integer, text, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { functionCalls } from "../function-calls/schema";

export const requestErrors = pgTable("request_errors", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  method: varchar("method", { length: 10 }).notNull(),
  url: text("url").notNull(),
  headers: jsonb("headers").$type<Record<string, string>>(),
  body: text("body"),
  stack: text("stack"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  functionCallId: integer("function_call_id")
    .references(() => functionCalls.id, { onDelete: "cascade" })
    .notNull(),
});

export const requestErrorsRelations = relations(requestErrors, ({ one }) => ({
  functionCall: one(functionCalls, {
    fields: [requestErrors.functionCallId],
    references: [functionCalls.id],
  }),
}));
