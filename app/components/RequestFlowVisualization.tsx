// app/components/RequestFlowVisualization.tsx

import "@xyflow/react/dist/style.css";

import {
  Background,
  Controls,
  Edge,
  Node,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { useCallback } from "react";

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

interface RequestFlowVisualizationProps {
  data: RequestNode;
}

function formatSize(bytes: number | null): string {
  if (bytes === null) return "N/A";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const RequestFlowVisualization = ({ data }: RequestFlowVisualizationProps) => {
  const createNodesAndEdges = useCallback((requestNode: RequestNode) => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const yOffset = 0;
    const xOffset = 0;

    const processNode = (node: RequestNode, level: number) => {
      // Create node
      nodes.push({
        id: node.id.toString(),
        type: "default",
        position: { x: xOffset, y: level * 150 },
        data: {
          label: (
            <div className="p-3 min-w-[250px] max-w-[350px]">
              <div className="font-bold truncate text-sm">{node.pathname}</div>
              <div className="text-xs text-gray-600 mt-1 grid grid-cols-2 gap-1">
                <span>Duration: {node.durationMs}ms</span>
                <span>Req: {formatSize(node.requestSizeBytes)}</span>
                <span>Res: {formatSize(node.responseSizeBytes)}</span>
                {node.objects.length > 0 && (
                  <span className="col-span-2">
                    Objects: {node.objects.map((o) => o.modelName).join(", ")}
                  </span>
                )}
              </div>
            </div>
          ),
        },
        className: "bg-white shadow-lg rounded-lg border border-gray-200",
        style: {
          width: 350,
          padding: 0,
        },
      });

      // Process children
      if (node.children.length > 0) {
        const childWidth = 400;
        const startX = (-(node.children.length - 1) * childWidth) / 2;

        node.children.forEach((child, index) => {
          const childXOffset = startX + index * childWidth;

          edges.push({
            id: `e${node.id}-${child.id}`,
            source: node.id.toString(),
            target: child.id.toString(),
            type: "smoothstep",
            animated: true,
            style: { stroke: "#666" },
          });

          processNode(child, level + 1);
        });
      }
    };

    processNode(data, 0);

    return { nodes, edges };
  }, []);

  const { nodes, edges } = createNodesAndEdges(data);
  const [reactFlowNodes, setNodes] = useNodesState(nodes);
  const [reactFlowEdges, setEdges] = useEdgesState(edges);

  return (
    <div style={{ width: "100%", height: "800px" }}>
      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: true,
        }}
        nodesDraggable={true}
        nodesConnectable={false}
        snapToGrid={true}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default RequestFlowVisualization;
