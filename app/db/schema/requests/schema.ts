// app/db/schema/requests/schema.ts
import { pgTable, serial } from "drizzle-orm/pg-core";

export const requests = pgTable("requests", {
  id: serial("id").primaryKey(),
});
