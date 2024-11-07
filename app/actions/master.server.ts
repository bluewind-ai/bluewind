// app/actions/master.server.ts

import { withActionMiddleware } from "~/lib/action-middleware.server";
import { loadCsvData } from "./load-csv-data.server";

async function masterAction() {
  // This await is where we'll intercept on hitCount = 2
  const csvData = await loadCsvData();

  return csvData;
}

export const master = withActionMiddleware("master", masterAction);
