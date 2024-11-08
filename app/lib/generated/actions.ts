// app/lib/generated/actions.ts
// This file is auto-generated. Do not edit it manually.

import { master } from "~/actions/master.server";
import { loadSelectors } from "~/actions/load-selectors.server";
import { loadCsvData } from "~/actions/load-csv-data.server";
import { loadActions } from "~/actions/load-actions.server";
import { getActionCallTree } from "~/actions/get-action-call-tree.server";

export const actions = {
  master: master,
  "load-selectors": loadSelectors,
  "load-csv-data": loadCsvData,
  "load-actions": loadActions,
  "get-action-call-tree": getActionCallTree,
} as const;
