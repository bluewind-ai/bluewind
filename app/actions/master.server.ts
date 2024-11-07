// app/actions/master.server.ts

import { createAction } from "~/lib/action-builder.server";
import { loadCsvData } from "./load-csv-data.server";

export const master = createAction("master", async () => {
  const csvData = await loadCsvData();
  return csvData;
});
