// app/actions/get-tables.server.ts

import * as schema from "~/db/schema";

export function getTables() {
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
    .filter(
      ([_, value]) =>
        value instanceof Object &&
        value !== null &&
        "columns" in value && // pgTable objects have a columns property
        typeof value === "object",
    )
    .map(([key]) => key);

  console.log("Tables found:", tables);
  return tables;
}
