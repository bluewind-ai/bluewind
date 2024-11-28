// app/api/run-route/store-cassette.tsx

import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { join } from "path";

import { models, objects, requests } from "~/db/schema";
import { db } from "~/middleware/main";

import { writeFile } from "../../lib/intercepted-fs";

const app = new Hono();

app.post("/", async (c) => {
  const parentRequestId = c.req.header("X-Parent-Request-Id");
  if (!parentRequestId) throw new Error("No parent request ID provided in headers");

  const results = await db
    .select({ object: objects, model: models, request: requests })
    .from(requests)
    .leftJoin(objects, sql`${objects.requestId} = ${requests.id}`)
    .leftJoin(models, sql`${objects.modelId} = ${models.id}`);

  const rootRequest = results.find((r) => r.request.id.toString() === parentRequestId);
  if (!rootRequest) throw new Error(`Root request not found for ID ${parentRequestId}`);

  // Build tree
  const getNode = (id: number) => {
    const reqResults = results.filter((r) => r.request.id === id);
    const req = reqResults[0].request;
    return {
      id,
      pathname: req.pathname,
      createdLocation: req.createdLocation,
      response: req.response,
      children: results
        .filter((r) => r.request.parentId === id)
        .map((r) => getNode(r.request.id))
        .sort((a, b) => a.id - b.id),
      objects: reqResults
        .filter((r) => r.object && r.model && r.model.singularName.toLowerCase() !== "request")
        .map((r) => ({
          modelName: r.model.singularName,
          createdLocation: r.object.createdLocation,
        })),
    };
  };

  const tree = getNode(rootRequest.request.id);

  // Generate output
  const renderNode = (node: any, indent = "") => {
    let out = `${indent}REQUEST ${node.pathname}\n`;
    out += `${indent}└─ Created at: ${node.createdLocation}\n`;
    if (node.response) {
      out += `${indent}RETURNED BODY\n`;
      try {
        const resp = JSON.parse(node.response);
        Object.entries(resp).forEach(([k, v]) => {
          out += `${indent}└─ ${k}: ${JSON.stringify(v)}\n`;
        });
      } catch (e) {
        out += `${indent}└─ ${node.response}\n`;
      }
    }
    out += "\n";
    node.objects.forEach((obj: any) => {
      out += `${indent}   └─ ${obj.modelName.toUpperCase()}\n`;
      out += `${indent}      └─ Created at: ${obj.createdLocation}\n\n`;
    });
    node.children.forEach((child: any) => {
      out += renderNode(child, `${indent}      `);
    });
    return out;
  };

  const cassette = `CASSETTE REPLAY\n=================\n\n${renderNode(tree)}-----------------\n\n`;

  await writeFile(join(process.cwd(), "cassette.txt"), cassette, "utf-8");
  await writeFile(join(process.cwd(), "cassette.json"), JSON.stringify({ tree }, null, 2), "utf-8");

  return c.json({ success: true });
});

export default app;
