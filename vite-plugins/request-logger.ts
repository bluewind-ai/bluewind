// vite-plugins/request-logger.ts

import type { Plugin } from "vite";

export function requestLoggerPlugin(): Plugin {
  return {
    name: "vite:request-logger",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Only log non-asset and non-HMR requests
        if (
          !req.url?.includes("/@") && // skip vite internal requests
          !req.url?.includes("node_modules") && // skip node_modules
          !req.url?.includes("favicon.ico") && // skip favicon
          !req.url?.endsWith(".css") && // skip css files
          !req.url?.includes("hmr") // skip hmr
        ) {
          // Remove query parameters for cleaner logs
          const cleanUrl = req.url?.split("?")[0];
          console.log(`[${req.method}] ${cleanUrl}`);
        }
        next();
      });
    },
  };
}
