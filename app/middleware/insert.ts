// app/middleware/insert.ts
import { fetchWithContext } from "~/lib/fetch-with-context";

import { ExtendedContext } from ".";

type FunctionWithApply = {
  (...args: unknown[]): unknown;
  apply(thisArg: any, argArray: unknown[]): unknown;
};
export async function insertMiddleware(
  target: any,
  value: FunctionWithApply,
  tableName: string,
  c: ExtendedContext,
  data: any,
) {
  if (!c.requestId) {
    throw new Error("Request ID is required in context for database operations");
  }
  // FIXED: Send data as array if it's an array
  const values = Array.isArray(data) ? data : { ...data, requestId: c.requestId };
  const response = await fetchWithContext(c)("http://localhost:5173/api/db-proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      operation: "insert",
      table: tableName,
      values: values,
    }),
  });
  if (!response.ok) {
    const result = await response.json();
    throw new Error(`DB Proxy error: ${result.error || "Unknown error"}`);
  }
  const result = await response.json();
  return result.data;
}
