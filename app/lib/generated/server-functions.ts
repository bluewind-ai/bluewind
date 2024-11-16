// app/lib/generated/server-functions.ts
import { getFunctionCallTree } from "~/functions/get-function-call-tree.server";
import { getTables } from "~/functions/get-tables.server";

export const serverFunctions = {
  "get-function-call-tree": getFunctionCallTree,
  "get-tables": getTables,
} as const;
