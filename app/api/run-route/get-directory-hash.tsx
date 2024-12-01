// app/api/run-route/get-directory-hash.tsx

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
app.post("/api/run-route/get-directory-hash", async (c) => {
  try {
    await sleep(2000); // Simulate long operation

    const dirPath = resolve("..", "bluewind-data", "sec-submissions");
    const dirStat = await stat(dirPath);

    // Get both mtime and ctime for maximum reliability
    const mtime = dirStat.mtimeMs; // modification time in milliseconds
    const ctime = dirStat.ctimeMs; // change time in milliseconds

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
