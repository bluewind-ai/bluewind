// app/db/schema/server-functions/schema.ts
import { relations } from "drizzle-orm";
import { integer, jsonb, pgEnum, pgTable, serial, text } from "drizzle-orm/pg-core";

import { ButtonVariant } from "~/lib/server-functions-types";

import { requests } from "../requests/schema";

export enum ServerFunctionType {
  SYSTEM = "SYSTEM",
  API = "API",
}
export const serverFunctionTypeEnum = pgEnum("server_function_type", [
  ServerFunctionType.SYSTEM,
  ServerFunctionType.API,
]);
export const serverFunctions = pgTable("server_functions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  type: serverFunctionTypeEnum("type").notNull(),
  hash: text("hash").notNull(), // Added hash column
  requestId: integer("request_id")
    .references(() => requests.id, { onDelete: "cascade" })
    .notNull(),
  metadata: jsonb("metadata").$type<{
    label: string;
    variant: ButtonVariant;
  }>(),
  createdLocation: text("created_location").notNull(),
}) satisfies any;
export const serverFunctionsRelations = relations(serverFunctions, ({ one }) => ({
  request: one(requests, {
    fields: [serverFunctions.requestId],
    references: [requests.id],
  }),
}));
