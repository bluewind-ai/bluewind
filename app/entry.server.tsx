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

import loadCsvRoute from "~/routes/load-csv";
import { StaticErrorPage } from "~/utils/error-utils";

import { ExtendedContext } from "./middleware";
import { mainMiddleware } from "./middleware/main";

declare module "hono" {
  interface ContextVariableMap {
    error: Error;
  }
}

const ABORT_DELAY = 5000;

function handleBotRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
) {
  return new Promise((resolve, reject) => {
    const { pipe, abort } = renderToPipeableStream(
      <RemixServer context={remixContext} url={request.url} abortDelay={ABORT_DELAY} />,
      {
        onAllReady() {
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
    const { pipe, abort } = renderToPipeableStream(
      <RemixServer context={remixContext} url={request.url} abortDelay={ABORT_DELAY} />,
      {
        onShellReady() {
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

    server.route("/run-route", loadCsvRoute);
    server.use("*", mainMiddleware);
    server.use("*", async (c: Context, next: () => Promise<void>) => {
      await next();
    });
  },
  getLoadContext(c: Context, _options): AppLoadContext {
    const ctx = c as ExtendedContext;
    // @ts-expect-error TODO: Fix this
    return {
      db: ctx.db as any, // Force the type to match
      queries: ctx.queries,
      requestId: ctx.requestId,
      functionCallId: ctx.functionCallId,
      requestTime: new Date().toISOString(),
      url: c.req.url,
      ...c, // Spread the rest of the context
    };
  },
});
