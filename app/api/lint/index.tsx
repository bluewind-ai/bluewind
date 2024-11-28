// app/api/lint/index.tsx

import { readdir } from "node:fs/promises";

import { Hono } from "hono";
import { join } from "path";

import { readFile } from "../../lib/intercepted-fs";

const app = new Hono();

async function findFilesRecursively(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const path = join(dir, entry.name);
      return entry.isDirectory() ? findFilesRecursively(path) : [path];
    }),
  );
  return files.flat();
}

app.post("/", async (c) => {
  console.log("[lint] Starting search for fetch calls...");

  const appDir = join(process.cwd(), "app");
  const allFiles = await findFilesRecursively(appDir);

  for (const file of allFiles) {
    const content = await readFile(file, "utf-8");
    if (content.includes("fetch(")) {
      const relativePath = file.split("app/")[1];
      return c.json({
        success: true,
        fetchLocation: relativePath,
      });
    }
  }

  return c.json({
    success: false,
    message: "No fetch calls found",
  });
});

export default app;
