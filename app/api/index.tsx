// app/api/index.tsx

import type { Hono } from "hono";
import * as ReactDOMServer from "react-dom/server";
import { encode } from "turbo-stream";

import { StaticErrorPage } from "~/utils/error-utils";

import { registerRoutes } from "./routes/register-routes";

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

  // Register all routes
  registerRoutes(server);
}

export default configureHonoServer;
