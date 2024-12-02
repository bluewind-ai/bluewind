// app/functions/get-request-tree-and-store-cassette.server.ts

import { eq } from "drizzle-orm";
import { writeFile } from "fs/promises";
import { join } from "path";

import { requests } from "~/db/schema";
import { db } from "~/middleware/main";

type XYFlowNode = {
  id: string;
  type: "default";
  position: {
    x: number;
    y: number;
  };
  data: {
    label: string;
    pathname: string;
    createdLocation: string;
    duration: number;
    requestSize: number;
    responseSize: number | null;
    responseStatus: number | null;
    cacheStatus: string;
    createdAt: Date;
    parentId: number | null;
    objects: any[];
    response: any;
    payload: any;
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
const createDebugAsciiTree = (tree: any): string => {
  const processNode = (node: any, prefix: string = "", isLast: boolean = true) => {
    let result = prefix + (isLast ? "└─" : "├─") + node.pathname + "\n";
    if (node.children && node.children.length > 0) {
      node.children.forEach((child: any, index: number) => {
        const childPrefix = prefix + (isLast ? "  " : "│ ");
        const isLastChild = index === node.children.length - 1;
        result += processNode(child, childPrefix, isLastChild);
      });
    }
    return result;
  };
  return (
    tree.pathname +
    "\n" +
    (tree.children || [])
      .map((child: any, index: number) =>
        processNode(child, "", index === (tree.children || []).length - 1),
      )
      .join("")
  );
};
const createEdge = (source: string, target: string): XYFlowEdge => ({
  id: `e${source}-${target}`,
  source,
  target,
  type: "smoothstep",
  animated: true,
});
const createXYFlowTree = (requestTree: any): XYFlowTree => {
  const nodes: XYFlowNode[] = [];
  const edges: XYFlowEdge[] = [];
  const nodesByParent: Map<number | null, any[]> = new Map();
  const groupNodes = (node: any) => {
    const parentId = node.parentId;
    if (!nodesByParent.has(parentId)) {
      nodesByParent.set(parentId, []);
    }
    nodesByParent.get(parentId)!.push(node);
    if (node.children) {
      node.children.forEach(groupNodes);
    }
  };
  groupNodes(requestTree);
  let currentY = 0;
  const processNode = (node: any, level: number) => {
    const currentNodeId = node.id.toString();
    nodes.push({
      id: currentNodeId,
      type: "default",
      position: {
        x: level * 200,
        y: currentY,
      },
      data: {
        label: node.pathname,
        pathname: node.pathname,
        createdLocation: node.createdLocation,
        duration: node.durationMs,
        requestSize: node.requestSizeBytes,
        responseSize: node.responseSizeBytes,
        responseStatus: node.responseStatus,
        cacheStatus: node.cacheStatus,
        createdAt: node.createdAt,
        parentId: node.parentId,
        objects: node.objects || [],
        response: node.response,
        payload: node.payload,
      },
    });
    currentY += 100;
    const siblings = nodesByParent.get(node.parentId) || [];
    const siblingIndex = siblings.findIndex((s) => s.id === node.id);
    if (siblingIndex < siblings.length - 1) {
      const nextSibling = siblings[siblingIndex + 1];
      edges.push(createEdge(currentNodeId, nextSibling.id.toString()));
    }
    if (node.children && node.children.length > 0) {
      const firstChild = node.children.sort((a, b) => a.id - b.id)[0];
      edges.push(createEdge(currentNodeId, firstChild.id.toString()));
      node.children
        .sort((a, b) => a.id - b.id)
        .forEach((child) => {
          processNode(child, level + 1);
        });
    }
  };
  processNode(requestTree, 0);
  return { nodes, edges };
};
const createMaskedXYFlowTree = (xyFlowTree: XYFlowTree): XYFlowTree => {
  return {
    nodes: xyFlowTree.nodes.map((node) => ({
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
        createdLocation: node.data.createdLocation,
        durationMsRange: getDurationRange(node.data.duration),
        requestSizeBytesRange: getBytesRange(node.data.requestSize),
        responseSizeBytesRange:
          node.data.responseSize !== null ? getBytesRange(node.data.responseSize) : "N/A",
        responseStatus: node.data.responseStatus,
        cacheStatus: node.data.cacheStatus,
        createdAt: "[MASKED]",
        parentId: "[MASKED]",
        objects: node.data.objects,
        response: "[MASKED]",
        duration: "[MASKED]",
        payload: "[MASKED]",
      },
    })),
    edges: xyFlowTree.edges.map((edge) => ({
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
    const allRequests = await db.select().from(requests);
    const requestMap = new Map(allRequests.map((r) => [r.id, r]));
    const buildTree = (currentId: number): any => {
      const current = requestMap.get(currentId);
      if (!current) return null;
      const children = allRequests
        .filter((r) => r.parentId === currentId)
        .sort((a, b) => a.id - b.id)
        .map((r) => buildTree(r.id))
        .filter((r) => r !== null);
      let response = null;
      try {
        response = current.response ? JSON.parse(current.response) : null;
      } catch (e) {}
      return {
        id: current.id,
        pathname: current.pathname,
        createdLocation: current.createdLocation,
        response,
        payload: current.payload,
        durationMs: current.durationMs,
        requestSizeBytes: current.requestSizeBytes,
        responseSizeBytes: current.responseSizeBytes,
        responseStatus: current.responseStatus,
        cacheStatus: current.cacheStatus,
        createdAt: current.createdAt,
        parentId: current.parentId,
        children,
        objects: [],
      };
    };
    return buildTree(requestId);
  }
  const tree = await buildRequestTree(rootRequestId);
  if (!tree) return null;
  const asciiTree = createDebugAsciiTree(tree);
  const xyFlowTree = createXYFlowTree(tree);
  const maskedTree = createMaskedXYFlowTree(xyFlowTree);
  const request = await db
    .select()
    .from(requests)
    .where(eq(requests.id, rootRequestId))
    .limit(1)
    .then((rows) => rows[0]);
  if (!request) return null;
  const cassette = {
    id: "[MASKED]",
    parentId: "[MASKED]",
    pathname: request.pathname,
    createdLocation: request.createdLocation,
    response: "[MASKED]",
    payload: "[MASKED]",
    nodes: maskedTree.nodes,
    edges: maskedTree.edges,
    cacheStatus: request.cacheStatus,
    createdAt: "[MASKED]",
    durationMs: "[MASKED]",
    responseStatus: request.responseStatus,
  };
  await writeFile(join(process.cwd(), "cassette.json"), JSON.stringify(cassette, null, 2), "utf-8");
  await db
    .update(requests)
    .set({
      nodes: xyFlowTree.nodes,
      edges: xyFlowTree.edges,
    })
    .where(eq(requests.id, rootRequestId));
  return {
    ...request,
    nodes: xyFlowTree.nodes,
    edges: xyFlowTree.edges,
  };
}
