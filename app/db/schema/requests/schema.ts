// app/db/schema/requests/schema.ts

import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { z } from "zod";

import { serverFunctions } from "../server-functions/schema";

export const requests = pgTable("requests", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull(),
  functionCallId: integer("function_call_id").notNull(),
  pathname: text("pathname").notNull(), // Added pathname following web standards (window.location.pathname)
});

export const RequestSchema = z.object({
  id: z.number(),
  requestId: z.number(),
  functionCallId: z.number(),
  pathname: z.string(),
});

export type CreateRequest = z.infer<typeof RequestSchema>;

export const requestsRelations = relations(requests, ({ many }) => ({
  serverFunctions: many(serverFunctions),
}));
