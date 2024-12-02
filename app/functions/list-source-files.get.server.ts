// app/functions/list-source-files.get.server.ts
import { relative, resolve } from "node:path";

import { readdir } from "~/lib/intercepted-fs";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export async function listSourceFiles(c: any) {
  try {
    await sleep(2000);
    const rootPath = resolve("app");
    const entries = await readdir(rootPath, { withFileTypes: true, recursive: true });
    const files = entries
      .filter((entry) => entry.isFile())
      .map((entry) => {
        const fullPath = resolve(rootPath, entry.path, entry.name);
        return relative(rootPath, fullPath);
      });
    return {
      files,
      directory: "../bluewind-data/sec-submissions",
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}
