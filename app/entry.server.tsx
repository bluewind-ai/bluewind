// app/entry.server.tsx

import { PassThrough } from "node:stream";

import type { AppLoadContext, EntryContext } from "@remix-run/node";
import { createReadableStreamFromReadable } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import type { Context } from "hono";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { createHonoServer } from "react-router-hono-server/node";

import type { db,ExtendedContext  } from "./middleware/main";
import { mainMiddleware } from "./middleware/main";

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
    // Error handling middleware
    server.use("*", async (c, next) => {
      try {
        // Call next first to let the error bubble up
        await next();
      } catch (error) {
        console.error("Error caught in top-level handler:", error);
        return new Response((error as Error).message, { status: 500 });
      }
    });

    // Our main middleware
    server.use("*", mainMiddleware);

    // Logging middleware
    server.use("*", async (c: Context, next: () => Promise<void>) => {
      console.log("🔍 Request to:", c.req.url);
      await next();
    });
  },
  getLoadContext(c: Context, _options) {
    const ctx = c as ExtendedContext;
    const context: AppLoadContext = {
      requestTime: new Date().toISOString(),
      url: c.req.url,
      db: ctx.db as typeof db,
      queries: ctx.queries,
      requestId: ctx.requestId,
    };
    return context;
  },
});
