// app/db/schema/objects/schema.ts

import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

import { models } from "../models/schema";
import { requests } from "../requests/schema";
import { TableModel } from "../table-models";

export const objects = pgTable(TableModel.OBJECTS, {
  id: serial("id").primaryKey(),
  modelId: integer("model_id")
    .notNull()
    .references(() => models.id),
  recordId: integer("record_id").notNull(),
  requestId: integer("request_id")
    .notNull()
    .references(() => requests.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdLocation: text("created_location").notNull(),
});

export const ObjectSchema = z.object({
  modelId: z.number(),
  recordId: z.number(),
  requestId: z.number(),
  createdLocation: z.string(),
});

export type CreateObject = z.infer<typeof ObjectSchema>;

export const objectsRelations = relations(objects, ({ one }) => ({
  model: one(models, {
    fields: [objects.modelId],
    references: [models.id],
  }),
  request: one(requests, {
    fields: [objects.requestId],
    references: [requests.id],
  }),
}));
