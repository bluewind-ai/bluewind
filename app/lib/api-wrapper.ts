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

    console.log("wrapServerFunction input payload:", payload);

    // Replace undefined with null in the entire payload recursively
    const payloadWithNulls = payload
      ? JSON.parse(JSON.stringify(payload, (_key, value) => (value === undefined ? null : value)))
      : {};

    const body = JSON.stringify(payloadWithNulls);
    console.log("wrapServerFunction stringified body:", body);

    const result = await fetch(`http://localhost:5173/api/${urlPath}`, {
      method,
      headers,
      body,
    }).then((r) => r.json());
    return result;
  };
}
