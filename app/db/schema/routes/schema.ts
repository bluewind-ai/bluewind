// app/db/schema/routes/schema.ts
import { relations } from "drizzle-orm";
import { integer, jsonb, pgEnum, pgTable, serial, text } from "drizzle-orm/pg-core";

import { ButtonVariant } from "~/lib/server-functions-types";

import { requests } from "../requests/schema";

export enum RouteType {
  SYSTEM = "SYSTEM",
  API = "API",
}
export const routeTypeEnum = pgEnum("route_type", [RouteType.SYSTEM, RouteType.API]);
export const routes = pgTable("routes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  type: routeTypeEnum("type").notNull(),
  hash: text("hash").notNull(),
  requestId: integer("request_id")
    .references(() => requests.id, { onDelete: "cascade" })
    .notNull(),
  metadata: jsonb("metadata").$type<{
    label: string;
    variant: ButtonVariant;
  }>(),
  createdLocation: text("created_location").notNull(),
}) satisfies any;
export const routesRelations = relations(routes, ({ one }) => ({
  request: one(requests, {
    fields: [routes.requestId],
    references: [requests.id],
  }),
}));
