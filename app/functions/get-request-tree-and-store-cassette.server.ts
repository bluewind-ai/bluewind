// app/functions/get-request-tree-and-store-cassette.server.ts

import { eq } from "drizzle-orm";
import { writeFile } from "fs/promises";
import { join } from "path";

import { requests } from "~/db/schema";
import { db } from "~/middleware/main";

type RequestTreeNode = {
  id: number;
  pathname: string;
  createdLocation: string;
  response: any;
  durationMs: number;
  requestSizeBytes: number;
  responseSizeBytes: number | null;
  children: RequestTreeNode[];
  objects: any[];
};

const getDurationRange = (ms: number): string => {
  return ms <= 1000 ? "< 1000" : "1001+";
};

const getBytesRange = (bytes: number): string => {
  const MB = 1024 * 1024;
  return bytes < MB ? "< 1 MB" : "1 MB+";
};

const processNode = (obj: any): any => {
  if (typeof obj !== "object" || obj === null) return obj;
  if (Array.isArray(obj)) {
    return obj.map(processNode);
  }

  const newObj: any = {};

  // Group node properties together first
  if (obj.id !== undefined) {
    newObj.id = "[MASKED]";
  }
  if (obj.pathname) {
    newObj.pathname = obj.pathname.includes("/get-request-tree/")
      ? obj.pathname.replace(/\/get-request-tree\/\d+/, "/get-request-tree/[MASKED]")
      : obj.pathname;
  }
  if (obj.createdLocation) {
    newObj.createdLocation = obj.createdLocation;
  }
  if (obj.response !== undefined) {
    newObj.response = processNode(obj.response);
  }
  if (obj.durationMs !== undefined) {
    newObj.durationMsRange = getDurationRange(obj.durationMs);
  }
  if (obj.requestSizeBytes !== undefined) {
    newObj.requestSizeBytesRange = getBytesRange(obj.requestSizeBytes);
  }
  if (obj.responseSizeBytes !== undefined) {
    newObj.responseSizeBytesRange = getBytesRange(obj.responseSizeBytes);
  }

  // Then add children and objects
  if (obj.children) {
    newObj.children = processNode(obj.children);
  }
  if (obj.objects) {
    newObj.objects = processNode(obj.objects);
  }

  // Process any remaining properties
  for (const key in obj) {
    if (
      !newObj.hasOwnProperty(key) &&
      key !== "durationMs" &&
      key !== "requestSizeBytes" &&
      key !== "responseSizeBytes"
    ) {
      newObj[key] = processNode(obj[key]);
    }
  }
  return newObj;
};

export async function getRequestTreeAndStoreCassette(rootRequestId: number) {
  // First build the tree
  async function buildRequestTree(requestId: number): Promise<RequestTreeNode | null> {
    const request = await db
      .select()
      .from(requests)
      .where(eq(requests.id, requestId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!request) return null;

    // Get all child requests
    const childRequests = await db.select().from(requests).where(eq(requests.parentId, requestId));

    // Build child trees recursively, preserving original order
    const children = await Promise.all(
      childRequests.map((child) => buildRequestTree(child.id)),
    ).then((results) => results.filter((r): r is RequestTreeNode => r !== null));

    let response = null;
    try {
      response = request.response ? JSON.parse(request.response) : null;
    } catch (e) {
      console.error(`Failed to parse response for request ${requestId}`);
    }

    const tree: RequestTreeNode = {
      id: request.id,
      pathname: request.pathname,
      createdLocation: request.createdLocation,
      response,
      durationMs: request.durationMs,
      requestSizeBytes: request.requestSizeBytes,
      responseSizeBytes: request.responseSizeBytes,
      children,
      objects: [],
    };
    return tree;
  }

  // Get the complete tree
  const tree = await buildRequestTree(rootRequestId);
  if (!tree) return null;

  // Store the tree in a file for request viewing
  await writeFile(
    join(process.cwd(), "data", "requests", `${rootRequestId}.json`),
    JSON.stringify(tree, null, 2),
    "utf-8",
  );

  // Create cassette version with masking
  const cassette = processNode(tree);
  await writeFile(join(process.cwd(), "cassette.json"), JSON.stringify(cassette, null, 2), "utf-8");
  return tree;
}
