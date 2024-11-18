// app/db/schema/requests/schema.ts
import { relations } from "drizzle-orm";
import { pgTable, serial } from "drizzle-orm/pg-core";
import { z } from "zod";

import { serverFunctions } from "../server-functions/schema";

export const requests = pgTable("requests", {
  id: serial("id").primaryKey(),
});
export const RequestSchema = z.object({
  id: z.number(),
});
export type CreateRequest = z.infer<typeof RequestSchema>;
export const requestsRelations = relations(requests, ({ many }) => ({
  serverFunctions: many(serverFunctions),
}));
