// app/lib/server-functions.ts

import { testNewMiddleware } from "~/functions/test-new-middleware.get.server";

const serverFunctionsList = {
  testNewMiddleware,
} as const;

function wrapServerFunction(name: string, fn: ServerFunction): ServerFunction {
  const method = name.includes(".get.") ? "GET" : "POST";

  return async (...args: any[]) => {
    console.log(`[ServerFn] Calling ${name} (${method}) with args:`, args);
    const result = await fn(...args);
    console.log(`[ServerFn] ${name} returned:`, result);
    return result;
  };
}

export { serverFunctionsList };

export const serverFn = Object.fromEntries(
  Object.entries(serverFunctionsList).map(([name, fn]) => [name, wrapServerFunction(name, fn)]),
);
