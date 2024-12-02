// app/lib/server-functions.ts

import { getDirectoryHash } from "~/functions/get-directory-hash.get.server";
import { ingestCompanyData } from "~/functions/ingest-company-data.get.server";
import { listSourceFiles } from "~/functions/list-source-files.get.server";
import { loadRoutes } from "~/functions/load-routes.get.server";
import { mainFlow } from "~/functions/main-flow.get.server";
import { setupInitialize } from "~/functions/setup-initialize.get.server";
import { testNewMiddleware } from "~/functions/test-new-middleware.get.server";
import { testRoute } from "~/functions/test-route.get.server";

import { wrapServerFunction } from "./api-wrapper";

export const functions = {
  testNewMiddleware,
  listSourceFiles,
  getDirectoryHash,
  ingestCompanyData,
  loadRoutes,
  setupInitialize,
  mainFlow,
  testRoute,
} as const;

export const serverFn = Object.fromEntries(
  Object.entries(functions).map(([name, fn]) => [name, wrapServerFunction(name, fn)]),
);
