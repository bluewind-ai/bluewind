// app/db/schema/apps/schema.ts
import { relations } from "drizzle-orm";
import { integer, pgTable, serial, varchar } from "drizzle-orm/pg-core";

import { functionCalls } from "../function-calls/schema";

export const apps = pgTable("apps", {
  id: serial("id").primaryKey(),
  value: varchar("value", { length: 50 }).notNull().unique(),
  label: varchar("label", { length: 50 }).notNull(),
  iconKey: varchar("icon_key", { length: 50 }).notNull(),
  order: integer("order").notNull(),
  functionCallId: integer("function_call_id")
    .references(() => functionCalls.id, { onDelete: "cascade" })
    .notNull(),
});
export const appsRelations = relations(apps, ({ one }) => ({
  functionCall: one(functionCalls, {
    fields: [apps.functionCallId],
    references: [functionCalls.id],
  }),
}));
