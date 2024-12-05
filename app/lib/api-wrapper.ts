// app/lib/api-wrapper.ts

export function wrapServerFunction(name: string, fn: ServerFunction): ServerFunction {
  // Throw immediately if this is a GET endpoint - we don't support those
  if (name.includes(".get.server")) {
    throw new Error(`GET endpoints are not supported - found in: ${name}`);
  }

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

    // Replace undefined with null in the entire payload recursively
    const payloadWithNulls = payload
      ? JSON.parse(JSON.stringify(payload, (_key, value) => (value === undefined ? null : value)))
      : {};
    const body = JSON.stringify(payloadWithNulls);
    const result = await fetch(`http://localhost:5173/api/${urlPath}`, {
      method: "POST",
      headers,
      body,
    }).then((r) => r.json());
    return result;
  };
}
