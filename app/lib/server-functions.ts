// app/lib/server-functions.ts

import { listSourceFiles } from "~/functions/list-source-files.get.server";
import { testNewMiddleware } from "~/functions/test-new-middleware.get.server";

import { wrapServerFunction } from "./api-wrapper";

const functions = {
  testNewMiddleware,
  listSourceFiles,
} as const;

export const serverFn = Object.fromEntries(
  Object.entries(functions).map(([name, fn]) => [name, wrapServerFunction(name, fn)]),
);
