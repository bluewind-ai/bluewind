// app/db/schema/requests/schema.ts
import { relations } from "drizzle-orm";
import { integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

import { serverFunctions } from "../server-functions/schema";

export const requests = pgTable("requests", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id"),
  pathname: text("pathname").notNull(),
  createdLocation: text("created_location").notNull(),
  response: text("response"),
  nodes: jsonb("nodes"), // Using JSONB for better performance and querying
  edges: jsonb("edges"), // Using JSONB for better performance and querying
  cacheStatus: text("cache_status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  durationMs: integer("duration_ms").notNull(),
  requestSizeBytes: integer("request_size_bytes").notNull(),
  responseSizeBytes: integer("response_size_bytes"),
});
// Define the node and edge types that match our current cassette structure
const FlowNode = z.object({
  id: z.string(),
  type: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.object({
    label: z.string(),
    pathname: z.string(),
    durationMsRange: z.string(),
    requestSizeBytesRange: z.string(),
    responseSizeBytesRange: z.string(),
    objects: z.array(z.any()),
    duration: z.string(),
    requestSize: z.number(),
    responseSize: z.number().nullable(),
  }),
});
const FlowEdge = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: z.string(),
  animated: z.boolean(),
});
export const RequestSchema = z.object({
  id: z.number(),
  parentId: z.number().nullable(),
  pathname: z.string(),
  createdLocation: z.string(),
  response: z.string().nullable(),
  nodes: z.array(FlowNode).nullable(), // Now directly an array of nodes
  edges: z.array(FlowEdge).nullable(), // Now directly an array of edges
  cacheStatus: z.string(),
  createdAt: z.date(),
  durationMs: z.number(),
  requestSizeBytes: z.number(),
  responseSizeBytes: z.number().nullable(),
});
export type CreateRequest = z.infer<typeof RequestSchema>;
export type FlowNode = z.infer<typeof FlowNode>;
export type FlowEdge = z.infer<typeof FlowEdge>;
export const requestsRelations = relations(requests, ({ many }) => ({
  serverFunctions: many(serverFunctions),
}));
