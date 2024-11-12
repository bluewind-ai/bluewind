// app/lib/middleware.ts

import { type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { AsyncLocalStorage } from "async_hooks";

import { db } from "~/db";

export type StoredOperation = {
  tableName: string;
  recordId: number;
};

export const operationsStorage = new AsyncLocalStorage<StoredOperation[]>();

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
  return await operationsStorage.run([], async () => {
    let result;
    try {
      result = await db.transaction(async () => {
        console.log("Inside transaction in middleware");
        const result = await fn();
        console.log("Function completed successfully in middleware, returned:", result);

        const operations = operationsStorage.getStore();
        console.log("Transaction about to commit. Collected operations:", operations);

        return result;
      });
      console.log("Transaction committed in middleware");
    } catch (error) {
      console.log("Transaction rolled back because of error:", error);
      console.log("Error stack:", error.stack);
      throw error;
    }

    console.log("Transaction in middleware finishing up with result:", result);
    return result;
  });
}

export const loaderMiddleware = <T>(args: LoaderFunctionArgs, fn: () => Promise<T>) => {
  console.log("Loader middleware called");
  return requestMiddleware<LoaderFunctionArgs, T>(args, fn);
};

export const actionMiddleware = <T>(args: ActionFunctionArgs, fn: () => Promise<T>) => {
  console.log("Action middleware called");
  return requestMiddleware<ActionFunctionArgs, T>(args, fn);
};
