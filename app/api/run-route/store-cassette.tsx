// app/api/run-route/store-cassette.tsx

import { Hono } from "hono";
import { join } from "path";

import { writeFile } from "../../lib/intercepted-fs";

const getDurationRange = (ms: number): string => {
  return ms <= 1000 ? "< 1000" : "1001+";
};

const processNode = (obj: any): any => {
  if (typeof obj !== "object" || obj === null) return obj;

  if (Array.isArray(obj)) {
    return obj.map(processNode);
  }

  const newObj = { ...obj };

  if (newObj.id !== undefined) {
    newObj.id = "[MASKED]";
  }

  if (
    newObj.pathname &&
    typeof newObj.pathname === "string" &&
    newObj.pathname.includes("/get-request-tree/")
  ) {
    newObj.pathname = newObj.pathname.replace(
      /\/get-request-tree\/\d+/,
      "/get-request-tree/[MASKED]",
    );
  }

  if (newObj.durationMs !== undefined) {
    newObj.durationMsRange = getDurationRange(newObj.durationMs);
    delete newObj.durationMs;
  }

  for (const key in newObj) {
    newObj[key] = processNode(newObj[key]);
  }

  return newObj;
};

const app = new Hono();

app.post("/api/run-route/store-cassette", async (c) => {
  const { cassette } = await c.req.json();
  const data = typeof cassette === "string" ? JSON.parse(cassette) : cassette;

  const processedCassette = processNode(data);
  const finalCassette = JSON.stringify(processedCassette, null, 2);

  await writeFile(join(process.cwd(), "cassette.json"), finalCassette, "utf-8");
  console.log("[Store-Cassette] Cassette stored successfully with masked IDs and duration ranges");
  return c.json({ success: true });
});

export default app;
