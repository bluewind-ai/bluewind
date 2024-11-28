// app/api/store-cassette/store-cassette.tsx

import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { join } from "path";

import { models, objects, requests } from "~/db/schema";
import { db } from "~/middleware/main";

import { writeFile } from "../../lib/intercepted-fs";

const app = new Hono();

app.post("/api/run-route/store-cassette", async (c) => {
  const parentRequestId = c.req.header("X-Parent-Request-Id");
  if (!parentRequestId) throw new Error("No parent request ID provided in headers");

  const results = await db
    .select({ object: objects, model: models, request: requests })
    .from(requests)
    .leftJoin(objects, sql`${objects.requestId} = ${requests.id}`)
    .leftJoin(models, sql`${objects.modelId} = ${models.id}`);

  const rootRequest = results.find((r) => r.request.id.toString() === parentRequestId);
  if (!rootRequest) throw new Error(`Root request not found for ID ${parentRequestId}`);

  const getNode = (id: number) => {
    const reqResults = results.filter((r) => r.request.id === id);
    const req = reqResults[0].request;
    return {
      id: req.id,
      pathname: req.pathname.replace(/\/\d+(?=\/|$)/g, "/:id"),
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
        }))
        .sort((a, b) => a.modelName.localeCompare(b.modelName)),
    };
  };

  const tree = getNode(rootRequest.request.id);

  const renderNode = (node: any, indent = "") => {
    let out = `${indent}REQUEST ${node.pathname}\n`;
    out += `${indent}└─ Created at: ${node.createdLocation}\n`;
    if (node.response) {
      out += `${indent}RETURNED BODY\n`;
      try {
        const resp = JSON.parse(node.response);
        const maskedResp = JSON.parse(
          JSON.stringify(resp)
            .replace(/"id":\s*\d+/g, '"id": "[ID]"')
            .replace(/"pathname":\s*"[^"]*\d+[^"]*"/g, (match) => match.replace(/\d+/g, ":id")),
        );
        out += `${indent}${JSON.stringify(maskedResp, null, 2)
          .split("\n")
          .join("\n" + indent)}\n`;
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

  return c.json({ success: true });
});

export default app;
