// vite-plugins/request-logger.ts

import type { Plugin } from "vite";

export function requestLoggerPlugin(): Plugin {
  return {
    name: "vite:request-logger",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        console.log(`[${req.method}] ${req.url}`);
        next();
      });
    },
  };
}
