// app/lib/generated/actions.ts
// This file is auto-generated. Do not edit it manually.

import { master } from "~/actions/master.server";
import { loadCsvData } from "~/actions/load-csv-data.server";
import { loadActions } from "~/actions/load-actions.server";
import { goNext } from "~/actions/go-next.server";

export const actions = {
  master: master,
  "load-csv-data": loadCsvData,
  "load-actions": loadActions,
  "go-next": goNext,
} as const;