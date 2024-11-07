// app/actions/master.server.ts

import { loadCsvData } from "./load-csv-data.server";
import { withActionMiddleware } from "~/lib/action-middleware.server";

export async function master() {
  const mockArgs = {
    request: new Request("http://localhost"),
    params: {},
    context: {},
  };

  const wrappedLoadCsvData = withActionMiddleware("load-csv-data", () => loadCsvData(mockArgs));
  return await wrappedLoadCsvData(mockArgs);
}
