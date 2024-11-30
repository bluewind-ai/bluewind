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

    // Build child trees recursively
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

  // Create cassette version (without IDs)
  function removeSensitiveInfo(node: RequestTreeNode): any {
    const { id, ...rest } = node;
    return {
      ...rest,
      children: node.children.map(removeSensitiveInfo),
    };
  }

  const cassette = removeSensitiveInfo(tree);
  await writeFile(join(process.cwd(), "cassette.json"), JSON.stringify(cassette, null, 2), "utf-8");

  return tree;
}
