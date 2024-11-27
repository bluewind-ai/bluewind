// app/api/routes/register-routes.tsx

import { Hono } from "hono";

import { mainMiddleware } from "~/middleware/main";

import lintRoute from "../lint";
import routesRoute from "../routes";
import ingestCompanyDataRoute from "../run-route/ingest-company-data";
import resetFactoryRoute from "../run-route/reset-factory";
import rootRoute from "../run-route/root";
import storeCassetteRoute from "../run-route/store-cassette";
import truncateRoute from "../run-route/truncate";
import testRoute from "../test-route";
import testRoute2 from "../test-route-2";

export function registerRoutes(server: Hono) {
  // Routes that must bypass middleware
  server.route("/api/run-route/root", rootRoute);
  server.route("/api/run-route/reset-factory", resetFactoryRoute);
  server.route("/api/run-route/store-cassette", storeCassetteRoute);

  // Add middleware before other routes
  server.use("*", mainMiddleware);

  // All other routes under /api
  server.route("/api/routes", routesRoute);
  server.route("/api/test-route", testRoute);
  server.route("/api/test-route-2", testRoute2);
  server.route("/api/lint", lintRoute);
  server.route("/api/run-route/truncate", truncateRoute);
  server.route("/api/run-route/ingest-company-data", ingestCompanyDataRoute);

  server.use("*", async (c, next) => {
    await next();
  });
}
