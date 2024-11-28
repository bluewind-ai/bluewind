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

// Recursive function to render a request and all its children
function renderRequest(request: any, allResults: any[], indent: string = ""): string {
  let output = "";

  // Deduplicate requests - we only want the first occurrence
  const uniqueResults = allResults.filter((r, index) => {
    return allResults.findIndex((x) => x.request.id === r.request.id) === index;
  });

  // Render current request
  output += `${indent}REQUEST ${request.request.pathname}\n`;
  output += `${indent}└─ Created at: ${request.request.createdLocation}\n`;
  output += `${indent}└─ Request created at: ${request.request.createdLocation}\n`;
  if (request.request.response) {
    output += `${indent}RETURNED BODY\n`;
    const responseLines = flattenJSON(JSON.parse(request.request.response));
    responseLines.forEach((line) => {
      output += `${indent}└─ ${line}\n`;
    });
  }
  output += "\n";

  // Get objects belonging to this request
  const requestObjects = allResults.filter(
    (r) =>
      r.object?.requestId === request.request.id &&
      r.model?.singularName !== "request" &&
      r.object != null &&
      r.model != null,
  );

  // Render request's objects
  for (const obj of requestObjects) {
    output += `${indent}   └─ ${obj.model.singularName.toUpperCase()}\n`;
    output += `${indent}      └─ Created at: ${obj.object.createdLocation}\n\n`;
  }

  // Get and render all child requests from the deduplicated results
  const childRequests = uniqueResults
    .filter((r) => r.request.parentId === request.request.id)
    .sort((a, b) => a.request.id - b.request.id);

  for (const childRequest of childRequests) {
    output += renderRequest(childRequest, allResults, `${indent}      `);
  }

  return output;
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

  // Use the recursive function to render the entire request tree
  cassette += renderRequest(rootRequest, results);

  cassette += "-----------------\n\n";

  const filePath = join(process.cwd(), "cassette.txt");
  await writeFile(filePath, cassette, "utf-8");

  return c.json({ success: true });
});

export default app;
