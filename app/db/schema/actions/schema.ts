// app/db/schema/actions/schema.ts

import { pgTable, serial, integer, varchar, type AnyPgColumn } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { functionCalls } from "../function-calls/schema";
import { actionTypeEnum } from "../enums";

export const actions = pgTable("actions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull().unique(),
  type: actionTypeEnum("type").notNull(),
  functionCallId: integer("function_call_id").references((): AnyPgColumn => functionCalls.id, {
    onDelete: "cascade",
  }),
});

export type Action = typeof actions.$inferSelect & {
  displayName: string;
};

export function enrichAction(action: typeof actions.$inferSelect): Action {
  return {
    ...action,
    displayName: action.name
      .split("-")
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
  };
}

export const actionsRelations = relations(actions, ({ one, many }) => ({
  calls: many(functionCalls),
  functionCall: one(functionCalls, {
    fields: [actions.functionCallId],
    references: [functionCalls.id],
  }),
}));
