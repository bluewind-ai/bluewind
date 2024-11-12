// app/functions/get-tables.server.ts

import * as schema from "~/db/schema";
import { createAction } from "~/lib/action-builder.server";

export const getTables = createAction("get-tables", async () => {
  const entries = Object.entries(schema);
  console.log(
    "Schema entries:",
    entries.map(([key, value]) => ({
      key,
      type: typeof value,
      isPgTable: value instanceof Object && "$type" in value,
    })),
  );

  const tables = Object.entries(schema)
    .filter(([_, value]) => value?.constructor?.name === "PgTable")
    .map(([key]) => key);

  console.log("Tables found:", tables);
  return tables;
});
