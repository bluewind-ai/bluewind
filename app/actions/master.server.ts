// app/actions/master.server.ts

import { loadCsvData } from "./load-csv-data.server";

export async function master() {
  const mockArgs = {
    request: new Request("http://localhost"),
    params: {},
    context: {},
  };

  return await loadCsvData(mockArgs);
}
