// app/db/schema/server-functions/schema.ts

import { relations } from "drizzle-orm";
import { integer, jsonb, pgEnum, pgTable, serial, text } from "drizzle-orm/pg-core";

import { ButtonVariant } from "~/lib/server-functions-types";

import { functionCalls } from "../function-calls/schema";
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
  name: text("name").notNull(),
  type: serverFunctionTypeEnum("type").notNull(),
  requestId: integer("request_id")
    .references(() => requests.id, { onDelete: "cascade" })
    .notNull(),
  functionCallId: integer("function_call_id").notNull(), // Added this
  metadata: jsonb("metadata").$type<{
    label: string;
    variant: ButtonVariant;
  }>(),
}) satisfies any;

export const serverFunctionsRelations = relations(serverFunctions, ({ one, many }) => ({
  request: one(requests, {
    fields: [serverFunctions.requestId],
    references: [requests.id],
  }),
  functionCalls: many(functionCalls),
}));
