// app/lib/generated/server-functions.ts

import { getFunctionCallTree } from "~/functions/get-function-call-tree.server";
import { getTables } from "~/functions/get-tables.server";
import { goNext } from "~/functions/go-next.server";
import { loadAppsToDb } from "~/functions/load-apps-to-db.server";
import { loadCsvData } from "~/functions/load-csv-data.server";
import { master } from "~/functions/master.server";
import { resetAll } from "~/functions/reset-all.server";

export const serverFunctions = {
  "get-function-call-tree": getFunctionCallTree,
  "get-tables": getTables,
  "go-next": goNext,
  "load-apps-to-db": loadAppsToDb,
  "load-csv-data": loadCsvData,
  master: master,
  "reset-all": resetAll,
} as const;
