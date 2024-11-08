// vite-plugins/request-logger.ts

import type { Plugin } from "vite";

export function requestLoggerPlugin(): Plugin {
  return {
    name: "vite:request-logger",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url;
        if (
          url &&
          !url.startsWith("/app") && // skip all /app requests
          !url.includes("/@") && // skip vite internal requests
          !url.includes("node_modules") && // skip node_modules
          !url.includes("favicon.ico") // skip favicon
        ) {
          // Remove query parameters for cleaner logs
          const cleanUrl = url.split("?")[0];
          console.log(`[${req.method}] ${cleanUrl}`);
        }
        next();
      });
    },
  };
}
