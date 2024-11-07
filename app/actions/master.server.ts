// app/actions/master.server.ts

import type { ActionFunctionArgs } from "@remix-run/node";
import { loadCsvData } from "./load-csv-data.server";

export async function master(args: ActionFunctionArgs) {
  // Just call the CSV loading function
  return await loadCsvData(args);
}
