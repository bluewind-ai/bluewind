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

  console.log("[store-cassette route] Running database query...");
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
  console.log("[store-cassette route] Query results:", results?.length || 0, "records");

  let cassette = "CASSETTE REPLAY\n=================\n\n";
  console.log("[store-cassette route] Building cassette...");

  const requestMap = new Map();
  console.log("[store-cassette route] Grouping by request...");

  for (const result of results) {
    const requestId = result.object.requestId;
    if (!requestMap.has(requestId)) {
      requestMap.set(requestId, []);
    }
    requestMap.get(requestId).push(result);
  }

  console.log("[store-cassette route] Processing", requestMap.size, "requests");

  for (const [requestId, items] of requestMap) {
    console.log("[store-cassette route] Processing request", requestId);
    const requestItem = items.find((item) => item.model.singularName === "request");
    if (requestItem) {
      cassette += `REQUEST ${requestId}\n`;
      cassette += `└─ Record ID: ${requestItem.object.recordId}\n`;
      cassette += `└─ Request ID: ${requestId}\n`;
      cassette += `└─ Created at: ${requestItem.object.createdLocation}\n`;
      cassette += `└─ Request created at: ${requestItem.request.createdLocation}\n`;
      cassette += `└─ Object ID: ${requestItem.object.id}\n\n`;

      const nestedItems = items.filter((item) => item.model.singularName !== "request");
      for (const item of nestedItems) {
        cassette += `   └─ ${item.model.singularName.toUpperCase()}\n`;
        cassette += `      └─ Record ID: ${item.object.recordId}\n`;
        cassette += `      └─ Request ID: ${requestId}\n`;
        cassette += `      └─ Created at: ${item.object.createdLocation}\n`;
        cassette += `      └─ Object ID: ${item.object.id}\n\n`;
      }

      cassette += "-----------------\n\n";
    }
  }

  console.log("[store-cassette route] Writing file...");
  const filePath = join(process.cwd(), "cassette.txt");
  await writeFile(filePath, cassette, "utf-8");
  console.log("[store-cassette route] File written successfully");

  return c.json({ success: true });
});

export default app;
