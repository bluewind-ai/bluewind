// app/api/get-request-tree/index.tsx
import { sql } from "drizzle-orm";
import { Hono } from "hono";

import { models } from "~/db/schema/models/schema";
import { objects } from "~/db/schema/objects/schema";
import { requests } from "~/db/schema/requests/schema";
import { db } from "~/middleware/main";

interface RequestNode {
  id: number;
  pathname: string;
  createdLocation: string;
  response: any;
  durationMs: number;
  requestSizeBytes: number;
  responseSizeBytes: number | null;
  children: RequestNode[];
  objects: Array<{
    modelName: string;
    createdLocation: string;
  }>;
}
const truncateArrays = (obj: any): any => {
  if (Array.isArray(obj)) {
    if (obj.length > 100) {
      return [...obj.slice(0, 3), "... and " + (obj.length - 3) + " more items"];
    }
    return obj.map((item) => truncateArrays(item));
  }
  if (typeof obj === "object" && obj !== null) {
    const newObj: any = {};
    for (const key in obj) {
      newObj[key] = truncateArrays(obj[key]);
    }
    return newObj;
  }
  return obj;
};
const processResponse = (response: string | null): any => {
  if (!response) return null;
  try {
    const parsed = JSON.parse(response);
    return truncateArrays(parsed);
  } catch (e) {
    return response;
  }
};
const app = new Hono();
app.get("/api/get-request-tree/:requestId", async (c) => {
  const requestId = parseInt(c.req.param("requestId"));
  const currentRequest = await db
    .select()
    .from(requests)
    .where(sql`${requests.id} = ${requestId}`)
    .limit(1);
  if (!currentRequest.length) {
    return c.json({ error: "Request not found" }, 404);
  }
  let rootRequest = currentRequest[0];
  while (rootRequest.parentId !== null) {
    const parentRequest = await db
      .select()
      .from(requests)
      .where(sql`${requests.id} = ${rootRequest.parentId}`)
      .limit(1);
    if (!parentRequest.length) break;
    rootRequest = parentRequest[0];
  }
  const results = await db
    .select({
      request: requests,
      object: objects,
      model: models,
    })
    .from(requests)
    .leftJoin(objects, sql`${objects.requestId} = ${requests.id}`)
    .leftJoin(models, sql`${objects.modelId} = ${models.id}`);
  const requestsMap = new Map<number, RequestNode>();
  for (const result of results) {
    if (!requestsMap.has(result.request.id)) {
      requestsMap.set(result.request.id, {
        id: result.request.id,
        pathname: result.request.pathname,
        createdLocation: result.request.createdLocation,
        response: processResponse(result.request.response),
        durationMs: result.request.durationMs,
        requestSizeBytes: result.request.requestSizeBytes,
        responseSizeBytes: result.request.responseSizeBytes,
        children: [],
        objects: [],
      });
    }
    if (result.object && result.model && result.model.singularName.toLowerCase() !== "request") {
      const node = requestsMap.get(result.request.id)!;
      node.objects.push({
        modelName: result.model.singularName,
        createdLocation: result.object.createdLocation,
      });
    }
  }
  for (const result of results) {
    if (result.request.parentId !== null) {
      const parentNode = requestsMap.get(result.request.parentId);
      const childNode = requestsMap.get(result.request.id);
      if (parentNode && childNode) {
        if (!parentNode.children.some((child) => child.id === childNode.id)) {
          parentNode.children.push(childNode);
        }
      }
    }
  }
  for (const node of requestsMap.values()) {
    node.children.sort((a, b) => {
      const aResult = results.find((r) => r.request.id === a.id);
      const bResult = results.find((r) => r.request.id === b.id);
      return (
        (aResult?.request.createdAt?.getTime() || 0) - (bResult?.request.createdAt?.getTime() || 0)
      );
    });
  }
  const tree = requestsMap.get(rootRequest.id);
  if (!tree) {
    return c.json({ error: "Failed to build request tree" }, 500);
  }
  return c.json({ tree });
});
export default app;
