// app/api/register-routes.tsx

import { Hono } from "hono";
import { logger } from "hono/logger";

import { mainMiddleware } from "~/middleware/main";

import dbProxyRoute from "./db-proxy";
import getRequestTreeRoute from "./get-request-tree";
import ingestCompanyDataRoute from "./ingest-company-data";
import lintRoute from "./lint";
import mainFlowRoute from "./main-flow";
import resetFactoryRoute from "./reset-factory";
import rootRoute from "./root";
import createRawDataRoute from "./run-route/create-raw-data";
import getDirectoryHashRoute from "./run-route/get-directory-hash"; // Add this import
import listSourceFilesRoute from "./run-route/list-source-files";
import storeCassetteRoute from "./run-route/store-cassette";
import setupRoute from "./setup";
import testDrizzleProxyRoute from "./test-drizzle-proxy";
import testRequestToProxyRoute from "./test-request-to-proxy";
import testRoute from "./test-route";
import testRoute2 from "./test-route-2";

const customLogger = (message: string, ...rest: string[]) => {
  // Only log if the message doesn't start with '<--' or '-->'
  if (!message.startsWith("<--") && !message.startsWith("-->")) {
  }
};

export function registerRoutes(server: Hono) {
  server.use("*", logger(customLogger));
  server.route("", rootRoute);
  server.route("", resetFactoryRoute);
  server.use("*", mainMiddleware);
  const routes = [
    mainFlowRoute,
    testRoute,
    testRoute2,
    lintRoute,
    ingestCompanyDataRoute,
    getRequestTreeRoute,
    storeCassetteRoute,
    listSourceFilesRoute,
    createRawDataRoute,
    setupRoute,
    testRequestToProxyRoute,
    testDrizzleProxyRoute,
    dbProxyRoute,
    getDirectoryHashRoute, // Add this route
  ];
  routes.forEach((route) => {
    server.route("", route);
  });
  server.use("*", async (c, next) => {
    await next();
  });
}
