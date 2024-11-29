// app/api/run-route/store-cassette.tsx

import { Hono } from "hono";
import { join } from "path";

import { writeFile } from "../../lib/intercepted-fs";

const app = new Hono();

app.post("/api/run-route/store-cassette", async (c) => {
  const { cassette } = await c.req.json();
  console.log("[Store-Cassette] Storing cassette.json");
  await writeFile(join(process.cwd(), "cassette.json"), cassette, "utf-8");
  console.log("[Store-Cassette] Cassette stored successfully");
  return c.json({ success: true });
});

export default app;
