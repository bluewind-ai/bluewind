// app/db/schema/requests/schema.ts

import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

import { serverFunctions } from "../server-functions/schema";

export const requests = pgTable("requests", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id"),
  pathname: text("pathname").notNull(),
  createdLocation: text("created_location").notNull(),
  response: text("response"),
  cacheStatus: text("cache_status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const RequestSchema = z.object({
  id: z.number(),
  parentId: z.number().nullable(),
  pathname: z.string(),
  createdLocation: z.string(),
  response: z.string().nullable(),
  cacheStatus: z.string(), // Made mandatory in DB but keeping schema flexible
  createdAt: z.date(),
});

export type CreateRequest = z.infer<typeof RequestSchema>;

export const requestsRelations = relations(requests, ({ many }) => ({
  serverFunctions: many(serverFunctions),
}));
