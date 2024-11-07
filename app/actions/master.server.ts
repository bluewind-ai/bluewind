// app/actions/master.server.ts

import { loadCsvData } from "./load-csv-data.server";

export async function master() {
  const csvData = await loadCsvData();
  return csvData;
}
