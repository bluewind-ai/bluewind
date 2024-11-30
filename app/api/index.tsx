// app/api/index.tsx
import type { Hono } from "hono";

import { registerRoutes } from "./register-routes";

export function configureHonoServer(server: Hono) {
  // Register all routes
  registerRoutes(server);
}
export default configureHonoServer;
