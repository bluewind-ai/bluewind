// app/functions/load-csv-data.server.ts
import { createAction } from "~/lib/action-builder.server";

export const loadCsvData = createAction("load-csv-data", async () => {
  return true;
});
