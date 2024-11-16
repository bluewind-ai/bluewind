// app/db/schema/objects/schema.ts
import { relations } from "drizzle-orm";
import { integer, pgTable, serial } from "drizzle-orm/pg-core";

import { functionCalls } from "../function-calls/schema";
import { models } from "../models/schema";
import { TableModel } from "../table-models";

export const objects = pgTable(TableModel.OBJECTS, {
  id: serial("id").primaryKey(),
  modelId: integer("model_id")
    .notNull()
    .references(() => models.id),
  recordId: integer("record_id").notNull(),
  functionCallId: integer("function_call_id"),
});
export const objectsRelations = relations(objects, ({ one }) => ({
  functionCall: one(functionCalls, {
    fields: [objects.functionCallId],
    references: [functionCalls.id],
  }),
  model: one(models, {
    fields: [objects.modelId],
    references: [models.id],
  }),
}));
