// app/lib/middleware.ts
import { type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";

import { db } from "~/db";
import { type DbClient } from "~/db/db-client";
import { requests } from "~/db/schema/requests/schema";

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
  const request = (args as any).request;
  const url = new URL(request.url);
  const stack = new Error().stack
    ?.split("\n")
    .filter((line) => line.includes("/app/"))
    .map((line) => `    at ${line.substring(line.indexOf("/app/"))}`)
    .reverse()
    .join("\n");
  // no-qa
  console.log(`${request.method} ${url.pathname} from:\n${stack}\n\n\n\n`);
  const [requestRecord] = await db.insert(requests).values({}).returning();
  // Put requestId in args.context
  args.context.requestId = requestRecord.id;
  // Pass the whole args.context to withContext
  const dbWithContext = db.withContext(args.context);
  // Put the contextualized db back in args.context
  args.context.db = dbWithContext;
  const result = await dbWithContext.transaction(async () => {
    const result = await fn(args);
    return result;
  });
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
