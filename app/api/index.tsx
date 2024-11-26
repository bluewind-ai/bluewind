// app/api/index.tsx

import type { Context, Hono } from "hono";
import * as ReactDOMServer from "react-dom/server";
import { encode } from "turbo-stream";

import { mainMiddleware } from "~/middleware/main";
import { StaticErrorPage } from "~/utils/error-utils";

import routesRoute from "./routes";
import resetFactoryRoute from "./run-route/reset-factory";
import rootRoute from "./run-route/root";
import truncateRoute from "./run-route/truncate";

export function configureHonoServer(server: Hono) {
  server.onError((err, c) => {
    const error = err instanceof Error ? err : new Error(String(err));
    if (c.req.url.endsWith(".data")) {
      const encoded = encode(
        {
          error: {
            data: {
              name: error.name,
              message: error.message,
              stack: error.stack,
            },
            status: 500,
            statusText: "Internal Server Error",
          },
        },
        {
          plugins: [
            (value: unknown) => {
              if (value && typeof value === "object" && "data" in value && "status" in value) {
                return [
                  "ErrorResponse",
                  (value as any).data,
                  (value as any).status,
                  (value as any).statusText,
                ];
              }
            },
          ],
        },
      );
      return c.body(encoded, {
        headers: {
          "Content-Type": "text/vnd.turbo-stream.html",
        },
        status: 500,
      });
    }
    const html = ReactDOMServer.renderToString(<StaticErrorPage error={error} />);
    return c.html(html, 500);
  });

  // Root route must be before middleware
  server.route("/api/run-route/root", rootRoute);

  // Add middleware before other routes
  server.use("*", mainMiddleware);

  // All other routes under /api
  server.route("/api/routes", routesRoute);
  server.route("/api/run-route/reset-factory", resetFactoryRoute);
  server.route("/api/run-route/truncate", truncateRoute);

  server.use("*", async (c: Context, next: () => Promise<void>) => {
    await next();
  });
}
