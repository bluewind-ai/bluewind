// app/api/register-routes.tsx

import { Hono } from "hono";

import { mainMiddleware } from "~/middleware/main";

import getRequestTreeRoute from "./get-request-tree";
import ingestCompanyDataRoute from "./ingest-company-data";
import lintRoute from "./lint";
import mainFlowRoute from "./main-flow";
import resetFactoryRoute from "./reset-factory";
import rootRoute from "./root";
import routesRoute from "./routes";
import listSourceFilesRoute from "./run-route/list-source-files";
import storeCassetteRoute from "./run-route/store-cassette";
import testRoute from "./test-route";
import testRoute2 from "./test-route-2";

export function registerRoutes(server: Hono) {
  server.route("", rootRoute);
  server.route("", resetFactoryRoute);
  server.use("*", mainMiddleware);
  const routes = [
    mainFlowRoute,
    routesRoute,
    testRoute,
    testRoute2,
    lintRoute,
    ingestCompanyDataRoute,
    getRequestTreeRoute,
    storeCassetteRoute,
    listSourceFilesRoute,
  ];
  routes.forEach((route) => {
    server.route("", route);
  });
  server.use("*", async (c, next) => {
    await next();
  });
}
