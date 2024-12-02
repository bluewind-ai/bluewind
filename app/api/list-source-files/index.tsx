// app/api/list-source-files/index.tsx

import { relative, resolve } from "node:path";

import { Hono } from "hono";

import { readdir } from "~/lib/intercepted-fs";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const app = new Hono();
app.post("/api/list-source-files", async (c) => {
  try {
    await sleep(2000);

    const rootPath = resolve("app"); // Changed from "." to "app"
    const entries = await readdir(rootPath, { withFileTypes: true, recursive: true });

    const files = entries
      .filter((entry) => entry.isFile())
      .map((entry) => {
        const fullPath = resolve(rootPath, entry.path, entry.name);
        return relative(rootPath, fullPath);
      });

    return c.json({
      files,
      directory: "../bluewind-data/sec-submissions",
    });
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
