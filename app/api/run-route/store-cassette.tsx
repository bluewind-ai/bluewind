// app/api/run-route/store-cassette.tsx

import { sql } from "drizzle-orm";
import { writeFile } from "fs/promises";
import { Hono } from "hono";
import { join } from "path";

import { objects } from "~/db/schema";
import { models } from "~/db/schema/models/schema";
import { requests } from "~/db/schema/requests/schema";
import { db } from "~/middleware/main";

interface RequestNode {
  id: number;
  pathname: string;
  createdLocation: string;
  response: string | null;
  children: RequestNode[];
  objects: Array<{
    modelName: string;
    createdLocation: string;
  }>;
}

function buildRequestTree(rootRequest: any, allResults: any[]): RequestNode {
  // First deduplicate the results by request ID
  const uniqueResults = allResults.reduce((acc, current) => {
    const existing = acc.find((r) => r.request.id === current.request.id);
    if (!existing) {
      acc.push(current);
    }
    return acc;
  }, []);

  // Build a map of all requests
  const requestsMap = new Map<number, RequestNode>();

  // First pass: create all request nodes
  for (const result of uniqueResults) {
    if (!requestsMap.has(result.request.id)) {
      requestsMap.set(result.request.id, {
        id: result.request.id,
        pathname: result.request.pathname,
        createdLocation: result.request.createdLocation,
        response: result.request.response,
        children: [],
        objects: [],
      });
    }

    // Add object if it exists and isn't a request object
    if (result.object && result.model && result.model.singularName.toLowerCase() !== "request") {
      const node = requestsMap.get(result.request.id)!;
      const objectExists = node.objects.some(
        (obj) => obj.createdLocation === result.object.createdLocation,
      );
      if (!objectExists) {
        node.objects.push({
          modelName: result.model.singularName,
          createdLocation: result.object.createdLocation,
        });
      }
    }
  }

  // Second pass: build parent-child relationships
  for (const result of uniqueResults) {
    if (result.request.parentId !== null) {
      const parentNode = requestsMap.get(result.request.parentId);
      const childNode = requestsMap.get(result.request.id);
      if (parentNode && childNode) {
        // Check if child is already added
        const childExists = parentNode.children.some((c) => c.id === childNode.id);
        if (!childExists) {
          parentNode.children.push(childNode);
        }
      }
    }
  }

  return requestsMap.get(rootRequest.request.id)!;
}

function renderTreeToString(node: RequestNode, indent: string = ""): string {
  let output = "";

  // Render current request
  output += `${indent}REQUEST ${node.pathname}\n`;
  output += `${indent}└─ Created at: ${node.createdLocation}\n`;

  // Handle response
  if (node.response) {
    output += `${indent}RETURNED BODY\n`;
    try {
      const responseObj = JSON.parse(node.response);
      Object.entries(responseObj).forEach(([key, value]) => {
        output += `${indent}└─ ${key}: ${JSON.stringify(value)}\n`;
      });
    } catch (e) {
      output += `${indent}└─ ${node.response}\n`;
    }
  }
  output += "\n";

  // Render objects (explicitly excluding request objects)
  for (const obj of node.objects.filter((obj) => obj.modelName.toLowerCase() !== "request")) {
    output += `${indent}   └─ ${obj.modelName.toUpperCase()}\n`;
    output += `${indent}      └─ Created at: ${obj.createdLocation}\n\n`;
  }

  // Render children
  for (const child of node.children.sort((a, b) => a.id - b.id)) {
    output += renderTreeToString(child, `${indent}      `);
  }

  return output;
}

const app = new Hono();

app.post("/", async (c) => {
  console.log("[store-cassette route] Starting...");

  const parentRequestId = c.req.header("X-Parent-Request-Id");
  if (!parentRequestId) {
    throw new Error("No parent request ID provided in headers");
  }

  const results = await db
    .select({
      object: objects,
      model: models,
      request: requests,
    })
    .from(requests)
    .leftJoin(objects, sql`${objects.requestId} = ${requests.id}`)
    .leftJoin(models, sql`${objects.modelId} = ${models.id}`);

  const rootRequest = results.find((r) => r.request.id.toString() === parentRequestId);

  if (!rootRequest) {
    throw new Error(`Root request not found for ID ${parentRequestId}`);
  }

  // Build the tree structure
  const tree = buildRequestTree(rootRequest, results);

  // Create readable output
  let cassette = "CASSETTE REPLAY\n=================\n\n";
  cassette += renderTreeToString(tree);
  cassette += "-----------------\n\n";

  // Store both the tree structure and readable format
  const filePath = join(process.cwd(), "cassette.txt");
  await writeFile(filePath, cassette, "utf-8");

  // Also store the JSON structure for programmatic access
  const jsonFilePath = join(process.cwd(), "cassette.json");
  await writeFile(jsonFilePath, JSON.stringify({ tree }, null, 2), "utf-8");

  return c.json({ success: true });
});

export default app;
