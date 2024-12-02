// app/api/register-routes.tsx
import { Hono } from "hono";
import { logger } from "hono/logger";

import { mainMiddleware } from "~/middleware/main";

import createRawDataRoute from "./create-raw-data";
import dbProxyRoute from "./db-proxy";
import getRequestTreeRoute from "./get-request-tree";
import lintRoute from "./lint";
import resetFactoryRoute from "./reset-factory";
import rootRoute from "./root";
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
  getRequestTree: getRequestTreeRoute,
  lint: lintRoute,
  resetFactory: resetFactoryRoute,
  root: rootRoute,
  storeCassette: storeCassetteRoute,
  testDrizzleProxy: testDrizzleProxyRoute,
  testRequestToProxy: testRequestToProxyRoute,
  testRoute: testRoute,
  testRoute2: testRoute2,
};
export const routesArray = [
  testRoute,
  testRoute2,
  lintRoute,
  getRequestTreeRoute,
  storeCassetteRoute,
  createRawDataRoute,
  testRequestToProxyRoute,
  testDrizzleProxyRoute,
  dbProxyRoute,
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
