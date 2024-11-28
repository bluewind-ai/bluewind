// app/db/schema/models/schema.ts
import { integer, pgEnum, pgTable, serial, text } from "drizzle-orm/pg-core";
import { z } from "zod";

import { TableModel } from "../table-models";

export const modelEnum = pgEnum("model", [
  TableModel.USERS,
  TableModel.SESSIONS,
  TableModel.SERVER_FUNCTIONS,
  TableModel.FUNCTION_CALLS,
  TableModel.REQUEST_ERRORS,
  TableModel.DEBUG_LOGS,
  TableModel.OBJECTS,
  TableModel.REQUESTS,
  TableModel.MODELS,
]);
export const models = pgTable(TableModel.MODELS, {
  id: serial("id").primaryKey(),
  pluralName: text("plural_name").notNull().unique(),
  singularName: text("singular_name").notNull().unique(),
  requestId: integer("request_id").notNull(),
  createdLocation: text("created_location").notNull(),
});
export const ModelSchema = z.object({
  id: z.number(),
  pluralName: z.string(),
  singularName: z.string(),
  requestId: z.number(),
  createdLocation: z.string(),
});
export type CreateModel = z.infer<typeof ModelSchema>;
