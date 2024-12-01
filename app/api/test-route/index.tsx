// app/api/test-route/index.tsx

import { Hono } from "hono";

import { fetchWithContext } from "~/lib/fetch-with-context";

const app = new Hono();

app.post("/api/test-route", async (c) => {
  // First test: convert Drizzle to HTTP format
  const proxyConversionTest = await fetchWithContext(c)(
    "http://localhost:5173/api/test-request-to-proxy",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestId: c.requestId,
      }),
    },
  );

  // Second test: make actual Drizzle call via proxy
  const drizzleProxyTest = await fetchWithContext(c)(
    "http://localhost:5173/api/test-drizzle-proxy",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestId: c.requestId,
      }),
    },
  );

  return c.json({
    proxyConversionResult: await proxyConversionTest.json(),
    drizzleProxyResult: await drizzleProxyTest.json(),
  });
});

export default app;
