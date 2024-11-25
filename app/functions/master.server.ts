// app/functions/master.server.ts
import { hc } from "hono/client";

import { ExtendedContext } from "~/middleware";
import type { LoadCsvType } from "~/routes/load-csv";

export async function master(c: ExtendedContext) {
  try {
    console.log("[master] Starting data load...");
    const client = hc<LoadCsvType>("/");
    const response = await client["run-route"]["load-csv"].$post();

    if (!response.ok) {
      throw new Error(`Failed to load CSV: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("[master] Load CSV result:", result);
  } catch (error) {
    console.error("[master] Error during data load:", error);
    throw error;
  }
}
