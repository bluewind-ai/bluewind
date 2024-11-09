// app/lib/generated/actions.ts
// This file is auto-generated. Do not edit it manually.

import { master } from "~/actions/master.server";
import { loadSelectors } from "~/actions/load-selectors.server";
import { loadCsvData } from "~/actions/load-csv-data.server";
import { loadAppsToDb } from "~/actions/load-apps-to-db.server";
import { loadActions } from "~/actions/load-actions.server";
import { getTables } from "~/actions/get-tables.server";
import { getActionCallTree } from "~/actions/get-action-call-tree.server";
import { executeGenerateApps } from "~/actions/executeGenerateApps.server";

export const actions = {
  master: master,
  "load-selectors": loadSelectors,
  "load-csv-data": loadCsvData,
  "load-apps-to-db": loadAppsToDb,
  "load-actions": loadActions,
  "get-tables": getTables,
  "get-action-call-tree": getActionCallTree,
  executeGenerateApps: executeGenerateApps,
} as const;
