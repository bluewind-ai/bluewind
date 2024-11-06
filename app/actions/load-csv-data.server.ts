// app/actions/load-csv-data.server.ts
/* eslint-disable @typescript-eslint/no-unused-vars */

import { withActionMiddleware } from "~/lib/action-middleware";
import type { ActionFunctionArgs } from "@remix-run/node";

export const loadCsvData = withActionMiddleware(async function loadCsvData(
  args: ActionFunctionArgs,
) {
  void 0;
  // CSV loading logic here
  return true;
});
