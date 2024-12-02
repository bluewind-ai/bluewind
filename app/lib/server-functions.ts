// app/lib/server-functions.ts

import { testNewMiddleware } from "~/functions/test-new-middleware.get.server";

const serverFunctionsList = {
  testNewMiddleware,
} as const;

function wrapServerFunction(name: string, fn: ServerFunction): ServerFunction {
  const method = name.includes(".get.") ? "GET" : "POST";

  return async (context: any) => {
    const requestId = context.requestId;
    console.log(`[ServerFn] Calling ${name} (${method}) with args:`, [requestId]);

    const headers = new Headers();
    headers.set("X-Parent-Request-Id", requestId.toString());

    // Convert function name to URL path
    const urlPath = "test-new-middleware";

    const result = await fetch(`http://localhost:5173/api/${urlPath}`, {
      method,
      headers,
      body: JSON.stringify({ args: [requestId] }),
    }).then((r) => r.json());

    console.log(`[ServerFn] ${name} returned:`, result);
    return result;
  };
}

export { serverFunctionsList };

export const serverFn = Object.fromEntries(
  Object.entries(serverFunctionsList).map(([name, fn]) => [name, wrapServerFunction(name, fn)]),
);
