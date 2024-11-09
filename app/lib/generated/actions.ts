// app/lib/generated/actions.ts
// This file is auto-generated. Do not edit it manually.

import { getFunctionCallTree } from "~/actions/get-function-call-tree.server";
import { getTables } from "~/actions/get-tables.server";
import { loadActions } from "~/actions/load-actions.server";
import { loadCsvData } from "~/actions/load-csv-data.server";
import { loadFiles } from "~/actions/load-files.server";
import { loadSelectors } from "~/actions/load-selectors.server";
import { loadAppsToDB } from "~/actions/loadAppsToDB.server";
import { master } from "~/actions/master.server";

export const actions = {
  "get-function-call-tree": getFunctionCallTree,
  "get-tables": getTables,
  "load-actions": loadActions,
  "load-csv-data": loadCsvData,
  "load-files": loadFiles,
  "load-selectors": loadSelectors,
  "loadAppsToDB": loadAppsToDB,
  "master": master
} as const;