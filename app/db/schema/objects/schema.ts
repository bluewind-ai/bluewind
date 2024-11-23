// app/db/schema/objects/schema.ts

import { relations } from "drizzle-orm";
import { integer, pgTable, serial } from "drizzle-orm/pg-core";
import { z } from "zod";

import { functionCalls } from "../function-calls/schema";
import { models } from "../models/schema";
import { requests } from "../requests/schema";
import { TableModel } from "../table-models";

export const objects = pgTable(TableModel.OBJECTS, {
  id: serial("id").primaryKey(),
  modelId: integer("model_id")
    .notNull()
    .references(() => models.id),
  recordId: integer("record_id").notNull(),
  functionCallId: integer("function_call_id")
    .notNull()
    .references(() => functionCalls.id, { onDelete: "cascade" }),
  requestId: integer("request_id")
    .notNull()
    .references(() => requests.id, { onDelete: "cascade" }),
});

export const ObjectSchema = z.object({
  modelId: z.number(),
  recordId: z.number(),
  requestId: z.number(),
  functionCallId: z.number(), // Made mandatory by removing optional()
});

export type CreateObject = z.infer<typeof ObjectSchema>;

export const objectsRelations = relations(objects, ({ one }) => ({
  functionCall: one(functionCalls, {
    fields: [objects.functionCallId],
    references: [functionCalls.id],
  }),
  model: one(models, {
    fields: [objects.modelId],
    references: [models.id],
  }),
  request: one(requests, {
    fields: [objects.requestId],
    references: [requests.id],
  }),
}));
