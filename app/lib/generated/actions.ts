// app/lib/generated/actions.ts
// This file is auto-generated. Do not edit it manually.

import { getActionCallTree } from "~/actions/get-action-call-tree.server";
import { getTables } from "~/actions/get-tables.server";
import { loadActions } from "~/actions/load-actions.server";
import { loadCsvData } from "~/actions/load-csv-data.server";
import { loadSelectors } from "~/actions/load-selectors.server";
import { loadAppsToDB } from "~/actions/loadAppsToDB.server";
import { master } from "~/actions/master.server";

export const actions = {
  "get-action-call-tree": getActionCallTree,
  "get-tables": getTables,
  "load-actions": loadActions,
  "load-csv-data": loadCsvData,
  "load-selectors": loadSelectors,
  loadAppsToDB: loadAppsToDB,
  master: master,
} as const;
