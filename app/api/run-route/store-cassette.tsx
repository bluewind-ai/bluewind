// app/api/run-route/store-cassette.tsx

import { writeFile } from "fs/promises";
import { Hono } from "hono";
import { join } from "path";

import { objects } from "~/db/schema";
import { db } from "~/middleware/main";

const app = new Hono();

app.post("/", async (c) => {
  console.log("[store-cassette route] Starting...");

  try {
    const results = await db.select().from(objects);

    console.log("[store-cassette route] Results:", results);

    let cassette = "CASSETTE REPLAY\n=================\n\n";

    for (const obj of results) {
      cassette += `Object created:\n`;
      cassette += `Model ID: ${obj.modelId}\n`;
      cassette += `Record ID: ${obj.recordId}\n`;
      cassette += `Request ID: ${obj.requestId}\n`;
      cassette += `Object ID: ${obj.id}\n`;
      cassette += "-----------------\n\n";
    }

    const filePath = join(process.cwd(), "cassette.txt");
    console.log("[store-cassette route] Writing cassette to:", filePath);
    console.log("[store-cassette route] Cassette content:", cassette);

    await writeFile(filePath, cassette, "utf-8");
    console.log("[store-cassette route] Cassette written successfully");

    return c.json({ success: true });
  } catch (error) {
    console.error("[store-cassette route] Error:", error);
    return c.json({ error: String(error) }, 500);
  }
});

export default app;
