// app/api/run-route/store-cassette.tsx

import { Hono } from "hono";
import { join } from "path";

import { writeFile } from "../../lib/intercepted-fs";

const app = new Hono();

app.post("/api/run-route/store-cassette", async (c) => {
  const { cassette } = await c.req.json();
  console.log("[Store-Cassette] Received cassette:", typeof cassette);

  const maskIds = (obj: any) => {
    if (typeof obj !== "object" || obj === null) return obj;

    const newObj = Array.isArray(obj) ? [] : {};
    for (const key in obj) {
      if (key === "id") {
        newObj[key] = "[MASKED]";
      } else {
        newObj[key] = maskIds(obj[key]);
      }
    }
    return newObj;
  };

  const dataToMask = typeof cassette === "string" ? JSON.parse(cassette) : cassette;
  const maskedCassette = maskIds(dataToMask);
  const maskedCassetteString = JSON.stringify(maskedCassette, null, 2);

  await writeFile(join(process.cwd(), "cassette.json"), maskedCassetteString, "utf-8");
  console.log("[Store-Cassette] Cassette stored successfully with masked IDs");
  return c.json({ success: true });
});

export default app;
