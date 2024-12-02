// app/api/get-directory-hash/index.tsx

import { stat } from "node:fs/promises";
import { resolve } from "node:path";

import { Hono } from "hono";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString("en-US", {
    timeZone: "UTC",
    timeZoneName: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const app = new Hono();
app.post("/api/get-directory-hash", async (c) => {
  try {
    await sleep(2000);

    const dirPath = resolve("app");
    const dirStat = await stat(dirPath);

    const mtime = dirStat.mtimeMs;
    const ctime = dirStat.ctimeMs;

    return c.json({
      mtime: formatDate(mtime),
      ctime: formatDate(ctime),
      mtimeRaw: mtime,
      ctimeRaw: ctime,
      directory: "../bluewind-data/sec-submissions",
    });
  } catch (error) {
    console.error("Directory stat error:", error);
    return c.json(
      {
        error: "Failed to get directory stats",
        details: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});

export default app;
