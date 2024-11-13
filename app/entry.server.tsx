// app/entry.server.tsx

import "./lib/debug"; // Added this import

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable unused-imports/no-unused-vars */
import { PassThrough } from "node:stream";

import type { AppLoadContext, EntryContext } from "@remix-run/node";
import { createReadableStreamFromReadable } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import type { Request as WebRequest } from "@remix-run/web-fetch";
import type { NextFunction, Request as ExpressRequest, Response } from "express";
import { isbot } from "isbot";
import morgan from "morgan";
import { renderToPipeableStream } from "react-dom/server";
import { createExpressApp } from "remix-create-express-app";

import { db } from "./db";
import { requests } from "./db/schema/requests/schema";
import { sayHello } from "./hello.server";

const ABORT_DELAY = 5000;
export default function handleRequest(
  request: WebRequest,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  _loadContext: AppLoadContext,
) {
  return isbot(request.headers.get("user-agent") || "")
    ? handleBotRequest(request, responseStatusCode, responseHeaders, remixContext)
    : handleBrowserRequest(request, responseStatusCode, responseHeaders, remixContext);
}
function handleBotRequest(
  request: WebRequest,
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
        },
      },
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
function handleBrowserRequest(
  request: WebRequest,
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
        },
      },
    );
    setTimeout(abort, ABORT_DELAY);
  });
}

// app/entry.server.tsx
export const app = createExpressApp({
  configure: (app) => {
    app.use(morgan("tiny"));
    app.use(async (req: ExpressRequest, res: Response, next: NextFunction) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const stack = new Error().stack
        ?.split("\n")
        .filter((line) => line.includes("/app/"))
        .map((line) => `    at ${line.substring(line.indexOf("/app/"))}`)
        .reverse()
        .join("\n");

      console.log(`${req.method} ${url.pathname} from:\n${stack}\n\n\n\n`);

      try {
        // First create the request record without a transaction
        const [requestRecord] = await db.insert(requests).values({}).returning();
        const requestId = requestRecord.id;

        // Now we can start a transaction with the requestId in context
        const dbWithContext = db.withContext({ requestId });
        const tx = dbWithContext.transaction(async (trx) => {
          (req as any).requestId = requestId;
          (req as any).trx = trx;
          next();
        });

        // Add error handling for the transaction
        tx.catch((error) => {
          console.error("Transaction failed:", error);
          next(error);
        });
      } catch (error) {
        console.error("Failed to create request record:", error);
        next(error);
      }
    });
  },
  getLoadContext: (req) => {
    const trx = (req as any).trx;
    return {
      db: trx ? db.withContext({ trx, requestId: (req as any).requestId }) : db,
      sayHello,
    } as AppLoadContext;
  },
  unstable_middleware: true,
});
