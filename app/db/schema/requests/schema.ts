// app/db/schema/requests/schema.ts

import { relations } from "drizzle-orm";
import { pgTable, serial } from "drizzle-orm/pg-core";

import { functionCalls } from "../function-calls/schema";
import { serverFunctions } from "../server-functions/schema";

export const requests = pgTable("requests", {
  id: serial("id").primaryKey(),
});

export const requestsRelations = relations(requests, ({ many }) => ({
  functionCalls: many(functionCalls),
  serverFunctions: many(serverFunctions),
}));
