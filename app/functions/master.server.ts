// app/functions/master.server.ts
import { hc } from "hono/client";

import { ExtendedContext } from "~/middleware";
import type { LoadCsvType } from "~/routes/load-csv";

export async function master(c: ExtendedContext) {
  try {
    const client = hc<LoadCsvType>("http://localhost:5173"); // Use your dev server URL
    const response = await client["run-route"]["load-csv"].$post();
    if (!response.ok) {
      throw new Error(`Failed to load CSV: ${response.statusText}`);
    }
    const result = await response.json();
  } catch (error) {
    throw error;
  }
}
