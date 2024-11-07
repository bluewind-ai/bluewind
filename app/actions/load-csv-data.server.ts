// app/actions/load-csv-data.server.ts

import { withActionMiddleware } from "~/lib/action-middleware.server";

export const loadCsvData = withActionMiddleware(async function loadCsvData() {
  void 0; // this can be removed
  // CSV loading logic here
  return true;
});
