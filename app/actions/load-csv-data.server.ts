// app/actions/load-csv-data.server.ts
/* eslint-disable @typescript-eslint/no-unused-vars */
import type { ActionFunctionArgs } from "@remix-run/node";
import { withActionMiddleware } from "~/lib/action-middleware.server";

async function loadCsvDataImpl(_args: ActionFunctionArgs) {
  // CSV loading logic here
  return true;
}

export const loadCsvData = withActionMiddleware(loadCsvDataImpl, "load-csv-data");
