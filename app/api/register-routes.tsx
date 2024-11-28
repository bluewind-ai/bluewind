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
import storeCassetteRoute from "./store-cassette";
import testRoute from "./test-route";
import testRoute2 from "./test-route-2";

export function registerRoutes(server: Hono) {
  server.route("", rootRoute);
  server.route("", resetFactoryRoute);
  server.route("", storeCassetteRoute);
  server.use("*", mainMiddleware);
  const routes = [
    mainFlowRoute,
    routesRoute,
    testRoute,
    testRoute2,
    lintRoute,
    ingestCompanyDataRoute,
    getRequestTreeRoute,
  ];
  routes.forEach((route) => {
    server.route("", route);
  });
  server.use("*", async (c, next) => {
    await next();
  });
}
