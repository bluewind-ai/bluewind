// app/actions/load-csv-data.server.ts

import { withActionMiddleware } from "~/lib/action-middleware.server";

export const loadCsvData = withActionMiddleware("load-csv-data", async () => {
  return true;
});
