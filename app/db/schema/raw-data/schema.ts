// app/db/schema/raw-data/schema.ts
import { relations } from "drizzle-orm";
import { integer, json, pgTable, serial } from "drizzle-orm/pg-core";

import { requests } from "../requests/schema";

export const rawData = pgTable("raw_data", {
  id: serial("id").primaryKey(),
  json_content: json("json_content").notNull(),
  requestId: integer("request_id")
    .references(() => requests.id, { onDelete: "cascade" })
    .notNull(),
});
export type RawData = typeof rawData.$inferSelect;
export const rawDataRelations = relations(rawData, ({ one }) => ({
  request: one(requests, {
    fields: [rawData.requestId],
    references: [requests.id],
  }),
}));
