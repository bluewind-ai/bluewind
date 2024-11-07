// app/actions/master.server.ts

import type { ActionFunctionArgs } from "@remix-run/node";
import { loadCsvData } from "./load-csv-data.server";
import { withActionMiddleware } from "~/lib/action-middleware.server";

async function masterImpl(args: ActionFunctionArgs) {
  return await loadCsvData(args);
}

export const master = withActionMiddleware("master", masterImpl);
