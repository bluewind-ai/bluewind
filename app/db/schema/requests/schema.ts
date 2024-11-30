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
  tree: text("tree"), // Added tree column
  cacheStatus: text("cache_status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  durationMs: integer("duration_ms").notNull(),
  requestSizeBytes: integer("request_size_bytes").notNull(),
  responseSizeBytes: integer("response_size_bytes"),
});

export const RequestSchema = z.object({
  id: z.number(),
  parentId: z.number().nullable(),
  pathname: z.string(),
  createdLocation: z.string(),
  response: z.string().nullable(),
  tree: z.string().nullable(), // Added tree to schema
  cacheStatus: z.string(),
  createdAt: z.date(),
  durationMs: z.number(),
  requestSizeBytes: z.number(),
  responseSizeBytes: z.number().nullable(),
});

export type CreateRequest = z.infer<typeof RequestSchema>;

export const requestsRelations = relations(requests, ({ many }) => ({
  serverFunctions: many(serverFunctions),
}));
