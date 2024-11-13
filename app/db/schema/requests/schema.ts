// app/db/schema/requests/schema.ts

import { pgTable, serial, uuid } from "drizzle-orm/pg-core";

export const requests = pgTable("requests", {
  id: serial("id").primaryKey(),
  requestId: uuid("request_id").notNull().unique(),
});
