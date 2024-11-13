// app/lib/middleware.ts

import { type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";

import { type DbClient } from "~/db/db-client";

declare module "@remix-run/node" {
  interface AppLoadContext {
    db: DbClient;
  }
}

async function requestMiddleware<
  Args extends {
    context: any;
  },
  T,
>(args: Args, fn: (args: Args) => Promise<T>): Promise<T> {
  // The db in args.context is already contextualized with requestId and transaction
  // from the Express middleware, so we can just use it directly
  const result = await fn(args);
  return result;
}

export const loaderMiddleware = <T>(
  args: LoaderFunctionArgs,
  fn: (args: LoaderFunctionArgs) => Promise<T>,
) => {
  return requestMiddleware<LoaderFunctionArgs, T>(args, fn);
};

export const actionMiddleware = <T>(
  args: ActionFunctionArgs,
  fn: (args: ActionFunctionArgs) => Promise<T>,
) => {
  return requestMiddleware<ActionFunctionArgs, T>(args, fn);
};
