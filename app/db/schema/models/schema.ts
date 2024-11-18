// app/db/schema/models/schema.ts
import { pgTable, serial, text } from "drizzle-orm/pg-core";
import { z } from "zod";

import { TableModel } from "../table-models";

export const models = pgTable(TableModel.MODELS, {
  id: serial("id").primaryKey(),
  pluralName: text("plural_name").notNull(),
  singularName: text("singular_name").notNull(),
});
export const ModelSchema = z.object({
  id: z.number(),
  pluralName: z.string(),
  singularName: z.string(),
});
export type CreateModel = z.infer<typeof ModelSchema>;
