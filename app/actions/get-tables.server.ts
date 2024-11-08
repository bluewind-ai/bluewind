// app/actions/get-tables.server.ts

import * as schema from "~/db/schema";
import { type PgTableWithColumns } from "drizzle-orm/pg-core";

export function getTables() {
  return Object.entries(schema)
    .filter(
      ([_, value]): value is PgTableWithColumns<any> =>
        typeof value === "object" &&
        value !== null &&
        "name" in value &&
        typeof value.name === "string",
    )
    .map(([_, table]) => table.name);
}
