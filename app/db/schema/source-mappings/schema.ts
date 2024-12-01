// app/db/schema/source-mappings/schema.ts

import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";

import { requests } from "../requests/schema";

export const sourceMappings = pgTable("source_mappings", {
  id: serial("id").primaryKey(),
  filePath: text("file_path").notNull(),
  requestId: integer("request_id")
    .references(() => requests.id, { onDelete: "cascade" })
    .notNull(),
});

export type SourceMapping = typeof sourceMappings.$inferSelect;
export const sourceMappingsRelations = relations(sourceMappings, ({ one }) => ({
  request: one(requests, {
    fields: [sourceMappings.requestId],
    references: [requests.id],
  }),
}));
