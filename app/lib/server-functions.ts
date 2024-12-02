// app/lib/server-functions.ts

import { testNewMiddleware } from "~/functions/test-new-middleware.get.server";

type ServerFunction = (...args: any[]) => Promise<any>;

function wrapServerFunction(name: string, fn: ServerFunction): ServerFunction {
  const method = name.includes(".get.") ? "GET" : "POST";

  return async (...args: any[]) => {
    console.log(`[ServerFn] Calling ${name} (${method}) with args:`, args);
    const result = await fn(...args);
    console.log(`[ServerFn] ${name} returned:`, result);
    return result;
  };
}

const serverFunctionsList = {
  testNewMiddleware,
} as const;

export const serverFn = Object.fromEntries(
  Object.entries(serverFunctionsList).map(([name, fn]) => [name, wrapServerFunction(name, fn)]),
);
