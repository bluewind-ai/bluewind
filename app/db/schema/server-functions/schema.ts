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

// This is for Drizzle migrations - exports a proper pgTable
export const serverFunctionsTableDefinition = pgTable("server_functions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: serverFunctionTypeEnum("type").notNull(),
  requestId: integer("request_id")
    .references(() => requests.id, { onDelete: "cascade" })
    .notNull()
    .$defaultFn(() => 0),
  functionCallId: integer("function_call_id")
    .notNull()
    .$defaultFn(() => 0),
  metadata: jsonb("metadata").$type<{
    label: string;
    variant: ButtonVariant;
  }>(),
});

type ServerFunctionInsert = {
  name: string;
  type: ServerFunctionType;
  metadata?: {
    label: string;
    variant: ButtonVariant;
  };
};

export const serverFunctions = {
  ...serverFunctionsTableDefinition,
  $inferInsert: {} as ServerFunctionInsert,
};

export const serverFunctionsRelations = relations(
  serverFunctionsTableDefinition,
  ({ one, many }) => ({
    request: one(requests, {
      fields: [serverFunctionsTableDefinition.requestId],
      references: [requests.id],
    }),
    functionCalls: many(functionCalls),
  }),
);
