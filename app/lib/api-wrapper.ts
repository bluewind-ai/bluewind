// app/lib/api-wrapper.ts

export function wrapServerFunction(name: string, fn: ServerFunction): ServerFunction {
  const method = name.includes(".get.") ? "GET" : "POST";
  return async (context: any) => {
    const requestId = context.requestId;
    console.log(`[ServerFn] Calling ${name} (${method}) with args:`, [requestId]);

    const headers = new Headers();
    headers.set("X-Parent-Request-Id", requestId.toString());
    const urlPath = name.replace(/\.(get|post)\.server$/, "");

    const result = await fetch(`http://localhost:5173/api/${urlPath}`, {
      method,
      headers,
      body: JSON.stringify({ args: [requestId] }),
    }).then((r) => r.json());

    console.log(`[ServerFn] ${name} returned:`, result);
    return result;
  };
}
