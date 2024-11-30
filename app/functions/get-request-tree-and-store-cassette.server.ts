// app/functions/get-request-tree-and-store-cassette.server.ts

import { eq } from "drizzle-orm";
import { writeFile } from "fs/promises";
import { join } from "path";

import { requests } from "~/db/schema";
import { db } from "~/middleware/main";

type XYFlowNode = {
  id: string;
  type: "default";
  position: { x: number; y: number };
  data: {
    label: string;
    pathname: string;
    duration: number;
    requestSize: number;
    responseSize: number | null;
    objects: any[];
  };
};

type XYFlowEdge = {
  id: string;
  source: string;
  target: string;
  type: "smoothstep";
  animated: boolean;
};

type XYFlowTree = {
  nodes: XYFlowNode[];
  edges: XYFlowEdge[];
};

const getDurationRange = (ms: number): string => {
  return ms <= 1000 ? "< 1000" : "1001+";
};

const getBytesRange = (bytes: number): string => {
  const MB = 1024 * 1024;
  return bytes < MB ? "< 1 MB" : "1 MB+";
};

const createXYFlowTree = (requestTree: any): XYFlowTree => {
  const nodes: XYFlowNode[] = [];
  const edges: XYFlowEdge[] = [];
  const levelWidths: { [level: number]: number } = {};

  const countNodesAtLevel = (node: any, level: number) => {
    levelWidths[level] = (levelWidths[level] || 0) + 1;
    node.children?.forEach((child: any) => countNodesAtLevel(child, level + 1));
  };
  countNodesAtLevel(requestTree, 0);

  const processNode = (node: any, level: number, index: number) => {
    const xSpacing = 400;
    const ySpacing = 150;

    const levelWidth = levelWidths[level] * xSpacing;
    const startX = -levelWidth / 2;
    const x = startX + index * xSpacing;
    const y = level * ySpacing;

    nodes.push({
      id: node.id.toString(),
      type: "default",
      position: { x, y },
      data: {
        label: node.pathname,
        pathname: node.pathname,
        duration: node.durationMs,
        requestSize: node.requestSizeBytes,
        responseSize: node.responseSizeBytes,
        objects: node.objects || [],
      },
    });

    if (node.children) {
      node.children.forEach((child: any, childIndex: number) => {
        edges.push({
          id: `e${node.id}-${child.id}`,
          source: node.id.toString(),
          target: child.id.toString(),
          type: "smoothstep",
          animated: true,
        });

        processNode(child, level + 1, childIndex);
      });
    }
  };

  processNode(requestTree, 0, 0);
  return { nodes, edges };
};

const createMaskedXYFlowTree = (xyFlowTree: XYFlowTree): XYFlowTree => {
  // Sort nodes by pathname to ensure consistent order
  const sortedNodes = [...xyFlowTree.nodes].sort((a, b) =>
    a.data.pathname.localeCompare(b.data.pathname),
  );

  // Sort edges by their id to ensure consistent order
  const sortedEdges = [...xyFlowTree.edges].sort((a, b) => a.id.localeCompare(b.id));

  return {
    nodes: sortedNodes.map((node) => ({
      id: "[MASKED]",
      type: "default",
      position: node.position,
      data: {
        label: node.data.pathname.includes("/get-request-tree/")
          ? node.data.pathname.replace(/\/get-request-tree\/\d+/, "/get-request-tree/[MASKED]")
          : node.data.pathname,
        pathname: node.data.pathname.includes("/get-request-tree/")
          ? node.data.pathname.replace(/\/get-request-tree\/\d+/, "/get-request-tree/[MASKED]")
          : node.data.pathname,
        durationMsRange: getDurationRange(node.data.duration),
        requestSizeBytesRange: getBytesRange(node.data.requestSize),
        responseSizeBytesRange:
          node.data.responseSize !== null ? getBytesRange(node.data.responseSize) : "N/A",
        objects: node.data.objects,
        // Keep original values for visualization
        duration: node.data.duration,
        requestSize: node.data.requestSize,
        responseSize: node.data.responseSize,
      },
    })),
    edges: sortedEdges.map((edge) => ({
      id: `e[MASKED]-[MASKED]`,
      source: "[MASKED]",
      target: "[MASKED]",
      type: "smoothstep",
      animated: true,
    })),
  };
};

export async function getRequestTreeAndStoreCassette(rootRequestId: number) {
  async function buildRequestTree(requestId: number) {
    const request = await db
      .select()
      .from(requests)
      .where(eq(requests.id, requestId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!request) return null;

    const childRequests = await db.select().from(requests).where(eq(requests.parentId, requestId));

    const children = await Promise.all(
      childRequests.map((child) => buildRequestTree(child.id)),
    ).then((results) => results.filter((r) => r !== null));

    let response = null;
    try {
      response = request.response ? JSON.parse(request.response) : null;
    } catch (e) {
      console.error(`Failed to parse response for request ${requestId}`);
    }

    return {
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
  }

  const tree = await buildRequestTree(rootRequestId);
  if (!tree) return null;

  const xyFlowTree = createXYFlowTree(tree);

  // Create cassette with the same structure but masked values
  const maskedTree = createMaskedXYFlowTree(xyFlowTree);

  // Only write the cassette to file
  await writeFile(
    join(process.cwd(), "cassette.json"),
    JSON.stringify(maskedTree, null, 2),
    "utf-8",
  );

  // Store the original tree for visualization
  await db
    .update(requests)
    .set({
      response: JSON.stringify({ tree: xyFlowTree }),
    })
    .where(eq(requests.id, rootRequestId));

  return xyFlowTree;
}
