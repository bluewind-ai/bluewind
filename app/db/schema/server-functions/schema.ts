// app/db/schema/server-functions/schema.ts
import { relations } from "drizzle-orm";
import { type AnyPgColumn, integer, pgTable, serial, varchar } from "drizzle-orm/pg-core";

import { serverFunctionTypeEnum } from "../enums";
import { functionCalls } from "../function-calls/schema";
import { requests } from "../requests/schema";

export const serverFunctions = pgTable("server_functions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull().unique(),
  type: serverFunctionTypeEnum("type").notNull(),
  requestId: integer("request_id")
    .references(() => requests.id, { onDelete: "cascade" })
    .notNull(),
  functionCallId: integer("function_call_id").references((): AnyPgColumn => functionCalls.id, {
    onDelete: "cascade",
  }),
});
export type ServerFunction = typeof serverFunctions.$inferSelect & {
  displayName: string;
};
export function enrichServerFunction(
  serverFunction: typeof serverFunctions.$inferSelect,
): ServerFunction {
  return {
    ...serverFunction,
    displayName: serverFunction.name
      .split("-")
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
  };
}
export const serverFunctionsRelations = relations(serverFunctions, ({ one, many }) => ({
  request: one(requests, {
    fields: [serverFunctions.requestId],
    references: [requests.id],
  }),
  calls: many(functionCalls),
  functionCall: one(functionCalls, {
    fields: [serverFunctions.functionCallId],
    references: [functionCalls.id],
  }),
}));
