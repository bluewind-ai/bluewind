// app/db/schema/models/schema.ts
import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";

import { requests } from "../requests/schema";
import { TableModel } from "../table-models";

export const models = pgTable(TableModel.MODELS, {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull(),
  pluralName: text("plural_name").notNull(),
  singularName: text("singular_name").notNull(),
});
export const modelsRelations = relations(models, ({ one }) => ({
  request: one(requests, {
    fields: [models.requestId],
    references: [requests.id],
  }),
}));
