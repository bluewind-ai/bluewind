// app/db/schema/objects/schema.ts
import { relations } from "drizzle-orm";
import { integer, pgTable } from "drizzle-orm/pg-core";

import { modelEnum } from "../enums";
import { functionCalls } from "../function-calls/schema";
import { TableModel } from "../table-models";

export const objects = pgTable(TableModel.OBJECTS, {
  id: integer("id").primaryKey().notNull(),
  model: modelEnum("model").notNull(),
  recordId: integer("record_id").notNull(),
  functionCallId: integer("function_call_id"),
});
export const objectsRelations = relations(objects, ({ one }) => ({
  functionCall: one(functionCalls, {
    fields: [objects.functionCallId],
    references: [functionCalls.id],
  }),
}));
