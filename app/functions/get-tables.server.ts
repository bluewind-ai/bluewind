// app/functions/get-tables.server.ts
import * as schema from "~/db/schema";
import { createAction } from "~/lib/action-builder.server";

export const getTables = createAction("get-tables", async () => {
  const tables = Object.entries(schema)
    .filter(([_, value]) => value?.constructor?.name === "PgTable")
    .map(([key]) => key);
  return tables;
});
