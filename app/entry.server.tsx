// app/entry.server.tsx

import "./lib/debug";

import { PassThrough } from "node:stream";

import type { AppLoadContext, EntryContext } from "@remix-run/node";
import { createReadableStreamFromReadable } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import type { Context } from "hono";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import * as ReactDOMServer from "react-dom/server";
import { createHonoServer } from "react-router-hono-server/node";
import { encode } from "turbo-stream";

import { StaticErrorPage } from "~/utils/error-utils";

import type { db, ExtendedContext } from "./middleware/main";
import { mainMiddleware } from "./middleware/main";

declare module "hono" {
  interface ContextVariableMap {
    error: Error;
  }
}

const ABORT_DELAY = 5_000;

function handleBotRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      <RemixServer context={remixContext} url={request.url} abortDelay={ABORT_DELAY} />,
      {
        onAllReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        },
      },
    );

    setTimeout(abort, ABORT_DELAY);
  });
}

function handleBrowserRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      <RemixServer context={remixContext} url={request.url} abortDelay={ABORT_DELAY} />,
      {
        onShellReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        },
      },
    );

    setTimeout(abort, ABORT_DELAY);
  });
}

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  _loadContext: AppLoadContext,
) {
  return isbot(request.headers.get("user-agent") || "")
    ? handleBotRequest(request, responseStatusCode, responseHeaders, remixContext)
    : handleBrowserRequest(request, responseStatusCode, responseHeaders, remixContext);
}

export const server = await createHonoServer({
  configure: (server) => {
    // Set up error handler first
    server.onError((err, c) => {
      console.error("🔥 Hono error handler caught:", err);
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

      console.error("Stack trace:", error.stack);
      const html = ReactDOMServer.renderToString(<StaticErrorPage error={error} />);
      return c.html(html, 500);
    });

    // Main middleware
    server.use("*", mainMiddleware);

    // Logging middleware
    server.use("*", async (c: Context, next: () => Promise<void>) => {
      console.log("🔍 Request to:", c.req.url);
      await next();
    });
  },
  getLoadContext(c: Context, _options) {
    const ctx = c as ExtendedContext;
    return {
      requestTime: new Date().toISOString(),
      url: c.req.url,
      db: ctx.db as typeof db,
      queries: ctx.queries,
      requestId: ctx.requestId,
    };
  },
});
