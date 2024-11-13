// app/db/schema/debug-logs/schema.ts
import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

import { functionCalls } from "../function-calls/schema";

export const debugLogs = pgTable("debug_logs", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  functionCallId: integer("function_call_id")
    .references(() => functionCalls.id, { onDelete: "cascade" })
    .notNull(),
});
export const debugLogsRelations = relations(debugLogs, ({ one }) => ({
  functionCall: one(functionCalls, {
    fields: [debugLogs.functionCallId],
    references: [functionCalls.id],
  }),
}));
