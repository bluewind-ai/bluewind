// app/lib/middleware.ts

import { type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";

import { db } from "~/db";
import { requests } from "~/db/schema/requests/schema";

async function requestMiddleware<Args, T>(args: Args, fn: () => Promise<T>): Promise<T> {
  const request = (args as any).request;
  const url = new URL(request.url);
  const stack = new Error().stack
    ?.split("\n")
    .filter((line) => line.includes("/app/"))
    .map((line) => `    at ${line.substring(line.indexOf("/app/"))}`)
    .reverse()
    .join("\n");
  console.log(`${request.method} ${url.pathname} from:\n${stack}\n\n\n\n`);

  console.log("Starting transaction in middleware for", request.method, url.pathname);

  // First create the request record
  const [requestRecord] = await db.insert(requests).values({}).returning();

  // Create db with the request context
  const dbWithContext = db.withContext({ requestId: requestRecord.id });

  console.log("Inside transaction in middleware");
  const result = await dbWithContext.transaction(async () => {
    console.log("Inside transaction in middleware");
    const result = await fn();
    console.log("Function completed successfully in middleware, returned:", result);
    console.log("Transaction about to commit");
    return result;
  });

  console.log("Transaction committed in middleware");
  console.log("Transaction in middleware finishing up with result:", result);
  return result;
}

export const loaderMiddleware = <T>(args: LoaderFunctionArgs, fn: () => Promise<T>) => {
  console.log("Loader middleware called");
  return requestMiddleware<LoaderFunctionArgs, T>(args, fn);
};

export const actionMiddleware = <T>(args: ActionFunctionArgs, fn: () => Promise<T>) => {
  console.log("Action middleware called");
  return requestMiddleware<ActionFunctionArgs, T>(args, fn);
};
