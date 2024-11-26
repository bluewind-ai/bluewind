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
  try {
    console.log("[store-cassette route] Starting...");

    // Changed: start FROM requests instead of objects
    const results = await db
      .select({
        object: objects,
        model: models,
        request: requests,
      })
      .from(requests)
      .leftJoin(objects, sql`${objects.requestId} = ${requests.id}`)
      .leftJoin(models, sql`${objects.modelId} = ${models.id}`);

    let cassette = "CASSETTE REPLAY\n=================\n\n";

    // Get parent request ID from headers
    const parentRequestId = c.req.header("X-Parent-Request-Id");
    if (!parentRequestId) {
      throw new Error("No parent request ID provided in headers");
    }

    // Find root request (using parent request ID from headers)
    const rootRequest = results.find((r) => r.request.id.toString() === parentRequestId);

    if (!rootRequest) {
      throw new Error(`Root request not found for ID ${parentRequestId}`);
    }

    // Render root request
    cassette += `REQUEST ${rootRequest.request.id}\n`;
    cassette += `└─ Record ID: ${rootRequest.object?.recordId || rootRequest.request.id}\n`;
    cassette += `└─ Parent ID: ${rootRequest.request.parentId}\n`;
    cassette += `└─ Created at: ${rootRequest.object?.createdLocation || rootRequest.request.createdLocation}\n`;
    cassette += `└─ Request created at: ${rootRequest.request.createdLocation}\n`;
    cassette += `└─ Object ID: ${rootRequest.object?.id || "N/A"}\n\n`;

    // Get all objects that belong to root request
    const rootObjects = results.filter(
      (r) =>
        r.object?.requestId === rootRequest.request.id &&
        r.model?.singularName !== "request" &&
        r.object != null &&
        r.model != null,
    );

    // Render root request's objects
    for (const obj of rootObjects) {
      cassette += `   └─ ${obj.model.singularName.toUpperCase()}\n`;
      cassette += `      └─ Record ID: ${obj.object.recordId}\n`;
      cassette += `      └─ Request ID: ${obj.object.requestId}\n`;
      cassette += `      └─ Created at: ${obj.object.createdLocation}\n`;
      cassette += `      └─ Object ID: ${obj.object.id}\n\n`;
    }

    // Get all child requests - now checks for parentId
    const childRequests = results.filter((r) => r.request.parentId === rootRequest.request.id);

    // For each child request
    for (const childRequest of childRequests) {
      // Render child request
      cassette += `   REQUEST ${childRequest.request.id}\n`;
      cassette += `   └─ Record ID: ${childRequest.object?.recordId || childRequest.request.id}\n`;
      cassette += `   └─ Parent ID: ${childRequest.request.parentId}\n`;
      cassette += `   └─ Created at: ${childRequest.object?.createdLocation || childRequest.request.createdLocation}\n`;
      cassette += `   └─ Request created at: ${childRequest.request.createdLocation}\n`;
      cassette += `   └─ Object ID: ${childRequest.object?.id || "N/A"}\n\n`;

      // Get objects belonging to this child request
      const childObjects = results.filter(
        (r) =>
          r.object?.requestId === childRequest.request.id &&
          r.model?.singularName !== "request" &&
          r.object != null &&
          r.model != null,
      );

      // Render child request's objects
      for (const obj of childObjects) {
        cassette += `      └─ ${obj.model.singularName.toUpperCase()}\n`;
        cassette += `         └─ Record ID: ${obj.object.recordId}\n`;
        cassette += `         └─ Request ID: ${obj.object.requestId}\n`;
        cassette += `         └─ Created at: ${obj.object.createdLocation}\n`;
        cassette += `         └─ Object ID: ${obj.object.id}\n\n`;
      }
    }

    cassette += "-----------------\n\n";

    const filePath = join(process.cwd(), "cassette.txt");
    await writeFile(filePath, cassette, "utf-8");

    return c.json({ success: true });
  } catch (error) {
    console.error("[store-cassette route] Error:", error);
    return c.json({ error: String(error) }, 500);
  }
});

export default app;
