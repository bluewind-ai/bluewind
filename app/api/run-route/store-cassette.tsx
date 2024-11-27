// app/api/run-route/store-cassette.tsx

import { sql } from "drizzle-orm";
import { writeFile } from "fs/promises";
import { Hono } from "hono";
import { join } from "path";

import { objects } from "~/db/schema";
import { models } from "~/db/schema/models/schema";
import { requests } from "~/db/schema/requests/schema";
import { db } from "~/middleware/main";

function flattenJSON(obj: any): string[] {
  const lines: string[] = [];

  Object.entries(obj).forEach(([key, value]) => {
    if (value !== null && typeof value === "object") {
      Object.entries(value).forEach(([subKey, subValue]) => {
        lines.push(`${key}.${subKey}: ${JSON.stringify(subValue)}`);
      });
    } else {
      lines.push(`${key}: ${JSON.stringify(value)}`);
    }
  });

  return lines;
}

const app = new Hono();

app.post("/", async (c) => {
  console.log("[store-cassette route] Starting...");

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

  const parentRequestId = c.req.header("X-Parent-Request-Id");
  if (!parentRequestId) {
    throw new Error("No parent request ID provided in headers");
  }

  const rootRequest = results.find((r) => r.request.id.toString() === parentRequestId);

  if (!rootRequest) {
    throw new Error(`Root request not found for ID ${parentRequestId}`);
  }

  // Render root request
  cassette += `REQUEST ${rootRequest.request.pathname}\n`;
  cassette += `└─ Created at: ${rootRequest.request.createdLocation}\n`;
  cassette += `└─ Request created at: ${rootRequest.request.createdLocation}\n`;
  if (rootRequest.request.response) {
    cassette += `RETURNED BODY\n`;
    const responseLines = flattenJSON(JSON.parse(rootRequest.request.response));
    responseLines.forEach((line) => {
      cassette += `└─ ${line}\n`;
    });
  }
  cassette += "\n";

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
    cassette += `      └─ Created at: ${obj.object.createdLocation}\n\n`;
  }

  // Get all child requests and sort by ID to maintain execution order
  const childRequests = results
    .filter((r) => r.request.parentId === rootRequest.request.id)
    .sort((a, b) => a.request.id - b.request.id);

  // For each child request - increased indentation here
  for (const childRequest of childRequests) {
    cassette += `      REQUEST ${childRequest.request.pathname}\n`;
    cassette += `      └─ Created at: ${childRequest.request.createdLocation}\n`;
    cassette += `      └─ Request created at: ${childRequest.request.createdLocation}\n`;
    if (childRequest.request.response) {
      cassette += `      RETURNED BODY\n`;
      const responseLines = flattenJSON(JSON.parse(childRequest.request.response));
      responseLines.forEach((line) => {
        cassette += `      └─ ${line}\n`;
      });
    }
    cassette += "\n";

    // Get objects belonging to this child request
    const childObjects = results.filter(
      (r) =>
        r.object?.requestId === childRequest.request.id &&
        r.model?.singularName !== "request" &&
        r.object != null &&
        r.model != null,
    );

    // Render child request's objects - increased indentation here
    for (const obj of childObjects) {
      cassette += `         └─ ${obj.model.singularName.toUpperCase()}\n`;
      cassette += `            └─ Created at: ${obj.object.createdLocation}\n\n`;
    }
  }

  cassette += "-----------------\n\n";

  const filePath = join(process.cwd(), "cassette.txt");
  await writeFile(filePath, cassette, "utf-8");

  return c.json({ success: true });
});

export default app;
