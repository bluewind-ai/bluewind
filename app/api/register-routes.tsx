// app/api/register-routes.tsx

import { Hono } from "hono";
import { logger } from "hono/logger";

import { mainMiddleware } from "~/middleware/main";

import createRawDataRoute from "./create-raw-data";
import dbProxyRoute from "./db-proxy";
import getDirectoryHashRoute from "./get-directory-hash";
import getRequestTreeRoute from "./get-request-tree";
import ingestCompanyDataRoute from "./ingest-company-data";
import lintRoute from "./lint";
import listSourceFilesRoute from "./list-source-files";
import loadRoutesRoute from "./load-routes"; // Add this import
import mainFlowRoute from "./main-flow";
import resetFactoryRoute from "./reset-factory";
import rootRoute from "./root";
import setupRoute from "./setup";
import storeCassetteRoute from "./store-cassettes";
import testDrizzleProxyRoute from "./test-drizzle-proxy";
import testRequestToProxyRoute from "./test-request-to-proxy";
import testRoute from "./test-route";
import testRoute2 from "./test-route-2";

const customLogger = (message: string, ...rest: string[]) => {
  // Only log if the message doesn't start with '<--' or '-->'
  if (!message.startsWith("<--") && !message.startsWith("-->")) {
  }
};

export const appRoutes = {
  createRawData: createRawDataRoute,
  dbProxy: dbProxyRoute,
  getDirectoryHash: getDirectoryHashRoute,
  getRequestTree: getRequestTreeRoute,
  ingestCompanyData: ingestCompanyDataRoute,
  lint: lintRoute,
  listSourceFiles: listSourceFilesRoute,
  loadRoutes: loadRoutesRoute,
  mainFlow: mainFlowRoute,
  resetFactory: resetFactoryRoute,
  root: rootRoute,
  setup: setupRoute,
  storeCassette: storeCassetteRoute,
  testDrizzleProxy: testDrizzleProxyRoute,
  testRequestToProxy: testRequestToProxyRoute,
  testRoute: testRoute,
  testRoute2: testRoute2,
};

export const routesArray = [
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
  getDirectoryHashRoute,
  loadRoutesRoute,
];

export function registerRoutes(server: Hono) {
  server.use("*", logger(customLogger));
  server.route("", rootRoute);
  server.route("", resetFactoryRoute);
  server.use("*", mainMiddleware);
  routesArray.forEach((route) => {
    server.route("", route);
  });
  server.use("*", async (c, next) => {
    await next();
  });
}
