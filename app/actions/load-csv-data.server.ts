// app/actions/load-csv-data.server.ts
/* eslint-disable @typescript-eslint/no-unused-vars */

import { withActionMiddleware } from "~/lib/action-middleware";
import type { ActionFunctionArgs } from "@remix-run/node";

export const loadCsvData = withActionMiddleware(async function loadCsvData(
  args: ActionFunctionArgs,
) {
  console.log("Loading CSV data");
  // CSV loading logic here
  return true;
});
