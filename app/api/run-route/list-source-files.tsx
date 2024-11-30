// app/api/run-route/list-source-files.tsx
import { readdir } from "node:fs/promises";
import { resolve } from "node:path";

import { Hono } from "hono";

const app = new Hono();
app.post("/api/run-route/list-source-files", async (c) => {
  try {
    const submissionsPath = resolve("..", "bluewind-data");
    const files = await readdir(submissionsPath);
    return c.json({ files });
  } catch (error) {
    return c.json(
      {
        error: "Failed to read directory",
        details: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});
export default app;
