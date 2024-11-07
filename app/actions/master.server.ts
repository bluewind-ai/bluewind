// app/actions/master.server.ts

import { loadCsvData } from "./load-csv-data.server";

export async function master() {
  // We create a mock ActionFunctionArgs to pass to loadCsvData
  const mockArgs = {
    request: new Request("http://localhost"),
    params: {},
    context: {},
  };

  return await loadCsvData(mockArgs);
}
