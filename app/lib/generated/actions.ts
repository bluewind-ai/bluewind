// app/lib/generated/actions.ts
// This file is auto-generated. Do not edit it manually.

import { getFunctionCallTree } from "~/functions/get-function-call-tree.server";
import { getTables } from "~/functions/get-tables.server";
import { goNext } from "~/functions/go-next.server";
import { loadAppsToDb } from "~/functions/load-apps-to-db.server";
import { loadCsvData } from "~/functions/load-csv-data.server";
import { loadFiles } from "~/functions/load-files.server";
import { master } from "~/functions/master.server";
import { resetAll } from "~/functions/reset-all.server";
import { testObjects } from "~/functions/test-objects.server";

export const actions = {
  "get-function-call-tree": getFunctionCallTree,
  "get-tables": getTables,
  "go-next": goNext,
  "load-apps-to-db": loadAppsToDb,
  "load-csv-data": loadCsvData,
  "load-files": loadFiles,
  master: master,
  "reset-all": resetAll,
  "test-objects": testObjects,
} as const;
