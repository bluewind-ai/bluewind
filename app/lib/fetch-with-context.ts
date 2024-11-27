// app/lib/fetch-with-context.ts

export function fetchWithContext(c: any) {
  return (url: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers);
    if (c.requestId) {
      headers.set("X-Parent-Request-Id", c.requestId.toString());
    }
    return fetch(url, {
      ...init,
      headers,
    });
  };
}
