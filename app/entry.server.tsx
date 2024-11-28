// app/entry.server.tsx

import type { EntryContext } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import type { Context } from "hono";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { createHonoServer } from "react-router-hono-server/node";
import { PassThrough } from "stream";

import { configureHonoServer } from "./api";
import { createLoadContext } from "./api/context";

// Override React's internal error logging
const originalConsoleError = console.error;
console.error = function (...args) {
  const message = typeof args[0] === "string" ? args[0] : "";
  if (message.includes("Warning: React.createElement: type is invalid")) {
    const error = new Error(args.join(" "));
    error.name = "ReactInvalidElementError";
    throw error;
  }
  return originalConsoleError.apply(console, args);
};

declare module "hono" {
  interface ContextVariableMap {
    remixContext: EntryContext;
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
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(body, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          );
          pipe(body);
        },
        onShellError: reject,
        onError: reject,
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
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(body, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          );
          pipe(body);
        },
        onShellError: reject,
        onError: reject,
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
) {
  return isbot(request.headers.get("user-agent"))
    ? handleBotRequest(request, responseStatusCode, responseHeaders, remixContext)
    : handleBrowserRequest(request, responseStatusCode, responseHeaders, remixContext);
}

export const server = await createHonoServer({
  configure: configureHonoServer,
  getLoadContext: (c: Context, options) => createLoadContext(c, options),
});
