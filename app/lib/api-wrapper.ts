// app/lib/api-wrapper.ts

export function wrapServerFunction(name: string, fn: ServerFunction): ServerFunction {
  const method = name.includes(".get.") ? "GET" : "POST";
  return async (context: any, payload?: any) => {
    if (!context?.requestId) {
      throw new Error("Context must have a requestId");
    }
    const requestId = context.requestId;
    const headers = new Headers();
    headers.set("X-Parent-Request-Id", requestId.toString());
    const urlPath = name
      .replace(/\.(get|post)\.server$/, "")
      .replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
    const result = await fetch(`http://localhost:5173/api/${urlPath}`, {
      method,
      headers,
      body: JSON.stringify(payload || {}),
    }).then((r) => r.json());
    return result;
  };
}
