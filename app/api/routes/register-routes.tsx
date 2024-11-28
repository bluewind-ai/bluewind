// app/api/routes/register-routes.tsx

import { Hono } from "hono";

import { mainMiddleware } from "~/middleware/main";

import getRequestTreeRoute from "../get-request-tree/get-request-tree";
import ingestCompanyDataRoute from "../ingest-company-data/ingest-company-data";
import lintRoute from "../lint";
import mainFlowRoute from "../main-flow";
import resetFactoryRoute from "../reset-factory/reset-factory";
import rootRoute from "../root/root";
import routesRoute from "../routes";
import storeCassetteRoute from "../store-cassette/store-cassette";
import testRoute from "../test-route";
import testRoute2 from "../test-route-2";

export function registerRoutes(server: Hono) {
  // Routes that must bypass middleware
  server.route("", rootRoute);
  server.route("", resetFactoryRoute);
  server.route("", storeCassetteRoute);

  // Add middleware before other routes
  server.use("*", mainMiddleware);

  // All other routes under /api
  const routes = [
    mainFlowRoute,
    routesRoute,
    testRoute,
    testRoute2,
    lintRoute,
    ingestCompanyDataRoute,
    getRequestTreeRoute,
  ];

  // Register all routes that use middleware
  routes.forEach((route) => {
    server.route("", route);
  });

  server.use("*", async (c, next) => {
    await next();
  });
}
