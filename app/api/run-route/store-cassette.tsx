// app/api/run-route/store-cassette.tsx

import { sql } from "drizzle-orm";
import { writeFile } from "fs/promises";
import { Hono } from "hono";
import { join } from "path";

import { objects } from "~/db/schema";
import { models } from "~/db/schema/models/schema";
import { requests } from "~/db/schema/requests/schema";
import { db } from "~/middleware/main";

const app = new Hono();

app.post("/", async (c) => {
  console.log("[store-cassette route] Starting...");

  try {
    const results = await db
      .select({
        object: objects,
        model: models,
        request: requests,
      })
      .from(objects)
      .leftJoin(models, sql`${objects.modelId} = ${models.id}`)
      .leftJoin(requests, sql`${objects.requestId} = ${requests.id}`)
      .orderBy(objects.createdAt);

    console.log("[store-cassette route] Results:", results);

    let cassette = "CASSETTE REPLAY\n=================\n\n";

    for (const result of results) {
      cassette += `A "${result.model.singularName}" was created:\n`;
      cassette += `Record ID: ${result.object.recordId}\n`;
      cassette += `In Request: ${result.object.requestId}\n`;
      cassette += `Created at location: ${result.object.createdLocation}\n`;
      if (result.model.singularName === "request" && result.request?.createdLocation) {
        cassette += `Request created at location: ${result.request.createdLocation}\n`;
      }
      cassette += `Object ID: ${result.object.id}\n`;
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
