// app/lib/middleware.ts

import { type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";

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

  return await fn();
}

export const loaderMiddleware = <T>(args: LoaderFunctionArgs, fn: () => Promise<T>) =>
  requestMiddleware<LoaderFunctionArgs, T>(args, fn);

export const actionMiddleware = <T>(args: ActionFunctionArgs, fn: () => Promise<T>) =>
  requestMiddleware<ActionFunctionArgs, T>(args, fn);
