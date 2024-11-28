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

// Override React's internal error logging with verbose details
const originalConsoleError = console.error;
console.error = function (...args) {
  const message = typeof args[0] === "string" ? args[0] : "";
  if (message.includes("Warning: React.createElement: type is invalid")) {
    console.log("\n=== DETAILED ERROR INFORMATION ===");
    console.log("Error occurred while rendering. Full arguments:", JSON.stringify(args, null, 2));
    console.log("\nStack trace:");
    const error = new Error(args.join(" "));
    error.name = "ReactInvalidElementError";
    console.log(error.stack);
    console.log("\nComponent rendering tree:");
    try {
      // Create a more detailed error to capture the component stack
      const componentError = new Error("Component stack trace");
      Error.captureStackTrace(componentError, console.error);
      console.log(
        componentError.stack
          ?.split("\n")
          .slice(1) // Remove the error message line
          .filter((line) => !line.includes("node_modules/react/")) // Filter out React internals
          .join("\n"),
      );
    } catch (e) {
      console.log("Could not capture component stack");
    }
    console.log("\nRoute information:");
    try {
      // Get the route information from the error message
      const match = error.stack?.match(/at mapRouteProperties.*\n\s+at map/);
      if (match) {
        console.log("Error occurred while processing route:", match[0]);
      }
    } catch (e) {
      console.log("Could not extract route information");
    }
    console.log("=== END ERROR INFORMATION ===\n");
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
