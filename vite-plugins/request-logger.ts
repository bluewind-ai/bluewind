// vite-plugins/request-logger.ts

import type { Plugin } from "vite";
import chalk from "chalk";

export function requestLoggerPlugin(): Plugin {
  return {
    name: "vite:request-logger",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url;
        if (
          url &&
          !url.startsWith("/app") &&
          !url.includes("/@") &&
          !url.includes("node_modules") &&
          !url.includes("favicon.ico")
        ) {
          const start = Date.now();
          const cleanUrl = url.split("?")[0];

          const originalEnd = res.end;
          res.end = function (chunk?: any, encoding?: BufferEncoding, cb?: () => void) {
            const duration = Date.now() - start;
            const status = res.statusCode;

            const statusColor =
              status >= 500
                ? chalk.red
                : status >= 400
                  ? chalk.yellow
                  : status >= 300
                    ? chalk.cyan
                    : status >= 200
                      ? chalk.green
                      : chalk.gray;

            console.log(
              `${chalk.dim(new Date().toISOString())} ` +
                `${chalk.bold(req.method)} ` +
                `${cleanUrl} ` +
                `${statusColor(status)} ` +
                `${chalk.dim(`${duration}ms`)}`,
            );

            return originalEnd.call(res, chunk, encoding, cb);
          };
        }
        next();
      });
    },
  };
}
