// app/actions/master.server.ts

import { withActionMiddleware } from "~/lib/action-middleware.server";
import { loadCsvData } from "./load-csv-data.server";

export const master = withActionMiddleware("master", async () => {
  return await loadCsvData();
});
