// app/api/test-route/index.tsx

import { readdir } from "node:fs/promises";
import { resolve } from "node:path";

import { Hono } from "hono";

const app = new Hono();

app.post("/api/test-route", async (c) => {
  try {
    const submissionsPath = resolve("..", "bluewind-data", "sec-submissions");
    const files = await readdir(submissionsPath);
    return c.json({ files });
  } catch (error) {
    console.error("Error reading directory:", error);
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
