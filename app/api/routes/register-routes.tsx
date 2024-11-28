// app/api/routes/register-routes.tsx

import { Hono } from "hono";

import { mainMiddleware } from "~/middleware/main";

import lintRoute from "../lint";
import routesRoute from "../routes";
import getRequestTreeRoute from "../run-route/get-request-tree";
import ingestCompanyDataRoute from "../run-route/ingest-company-data";
import mainFlowRoute from "../run-route/main-flow";
import resetFactoryRoute from "../run-route/reset-factory";
import rootRoute from "../run-route/root";
import storeCassetteRoute from "../run-route/store-cassette";
import truncateRoute from "../run-route/truncate";
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
    truncateRoute,
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
