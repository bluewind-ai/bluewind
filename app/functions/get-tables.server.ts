// app/functions/get-tables.server.ts
import * as schema from "~/db/schema";

export const getTables = async () => {
  const tables = Object.entries(schema)
    .filter(([_, value]) => value?.constructor?.name === "PgTable")
    .map(([key]) => key);
  return tables;
};
