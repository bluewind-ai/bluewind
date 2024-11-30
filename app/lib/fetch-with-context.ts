// app/lib/fetch-with-context.ts
export function fetchWithContext(c: any) {
  return (url: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers);
    if (c.requestId) {
      headers.set("X-Parent-Request-Id", c.requestId.toString());
    }
    // Add cache header for list-source-files route
    if (url.includes("/api/run-route/list-source-files")) {
      headers.set("Cache-Control", "only-if-cached");
    }
    return fetch(url, {
      ...init,
      headers,
    });
  };
}
