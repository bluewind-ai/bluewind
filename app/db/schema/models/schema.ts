// app/db/schema/models/schema.ts

import { pgTable, serial, text } from "drizzle-orm/pg-core";

import { TableModel } from "../table-models";

export const models = pgTable(TableModel.MODELS, {
  id: serial("id").primaryKey(),
  pluralName: text("plural_name").notNull(),
  singularName: text("singular_name").notNull(),
});

// No relations needed since models are standalone reference data
