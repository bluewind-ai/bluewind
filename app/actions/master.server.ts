// app/actions/master.server.ts

import { withActionMiddleware } from "~/lib/action-middleware.server";
import { loadCsvData } from "./load-csv-data.server";
import type { ActionFunctionArgs } from "@remix-run/node";

export const master = withActionMiddleware(async function master(args: ActionFunctionArgs) {
  return await loadCsvData(args);
});
