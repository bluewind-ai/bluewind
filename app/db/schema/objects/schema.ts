// app/db/schema/objects/schema.ts

import { pgTable, serial, integer, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { functionCalls } from "../function-calls/schema";

export const objects = pgTable("objects", {
  id: serial("id").primaryKey(),
  model: text("model").notNull(),
  recordId: integer("record_id").notNull(),
  functionCallId: integer("function_call_id")
    .references(() => functionCalls.id, { onDelete: "cascade" })
    .notNull(),
});

export const objectsRelations = relations(objects, ({ one }) => ({
  functionCall: one(functionCalls, {
    fields: [objects.functionCallId],
    references: [functionCalls.id],
  }),
}));
