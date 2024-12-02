// app/components/RequestFlowVisualization.tsx
import "@xyflow/react/dist/style.css";

import { Background, Controls, Node, Panel, ReactFlow } from "@xyflow/react";
import { useCallback, useState } from "react";

interface RequestFlowVisualizationProps {
  data: {
    id: number;
    parentId: number | null;
    pathname: string;
    createdLocation: string;
    response: string | null;
    nodes: Array<{
      id: string;
      type: string;
      position: {
        x: number;
        y: number;
      };
      data: {
        label: string;
        pathname: string;
        duration: number;
        requestSize: number;
        responseSize: number | null;
        objects: any[];
        createdLocation: string;
        cacheStatus: string;
        createdAt: string;
        response: any;
        payload: any;
      };
    }>;
    edges: Array<{
      id: string;
      source: string;
      target: string;
      type: string;
      animated: boolean;
    }>;
    cacheStatus: string;
    createdAt: string;
    durationMs: number;
    requestSizeBytes: number;
    responseSizeBytes: number | null;
  };
}
type NodeData = RequestFlowVisualizationProps["data"]["nodes"][0]["data"];
type FlowNode = Node<NodeData>;
const RequestFlowVisualization = ({ data }: RequestFlowVisualizationProps) => {
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const onNodeClick = useCallback((event: React.MouseEvent, node: FlowNode) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedNode((current) => (current?.id === node.id ? null : node));
  }, []);
  try {
    return (
      <div className="relative flex w-full h-[600px]">
        <div className="flex-1">
          <ReactFlow
            nodes={data.nodes || []}
            edges={data.edges || []}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            defaultEdgeOptions={{
              type: "smoothstep",
              animated: true,
            }}
            nodesDraggable={false}
            nodesConnectable={false}
            preventScrolling={false}
            zoomOnScroll={true}
            panOnScroll={true}
            panOnScrollMode="free"
            selectionOnDrag={false}
            zoomOnPinch={true}
            panOnDrag={false}
            onNodeClick={onNodeClick}
            onError={(error) => console.error("ReactFlow error:", error)}
          >
            <Background />
            <Controls showInteractive={false} />
            <Panel position="top-left" className="bg-white/75 p-2 rounded text-sm">
              Scroll to pan, Pinch/Ctrl+Scroll to zoom
            </Panel>
          </ReactFlow>
        </div>
        {selectedNode && (
          <div className="absolute right-0 top-0 h-full w-80 p-4 border-l border-gray-200 bg-white overflow-auto shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{selectedNode.data.pathname}</h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Duration:</span> {selectedNode.data.duration}ms
              </div>
              <div>
                <span className="font-medium">Cache Status:</span> {selectedNode.data.cacheStatus}
              </div>
              <div>
                <span className="font-medium">Request Size:</span> {selectedNode.data.requestSize}{" "}
                bytes
              </div>
              <div>
                <span className="font-medium">Response Size:</span>{" "}
                {selectedNode.data.responseSize ?? "N/A"} bytes
              </div>
              <div>
                <span className="font-medium">Created At:</span>{" "}
                {new Date(selectedNode.data.createdAt).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Location:</span> {selectedNode.data.createdLocation}
              </div>
              {selectedNode.data.payload && (
                <div>
                  <h4 className="font-medium mt-4 mb-2">Payload</h4>
                  <pre className="bg-gray-50 p-2 rounded text-sm overflow-auto">
                    {JSON.stringify(selectedNode.data.payload, null, 2)}
                  </pre>
                </div>
              )}
              {selectedNode.data.response && (
                <div>
                  <h4 className="font-medium mt-4 mb-2">Response</h4>
                  <pre className="bg-gray-50 p-2 rounded text-sm overflow-auto">
                    {JSON.stringify(selectedNode.data.response, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    return <div>Error rendering flow: {String(error)}</div>;
  }
};
export default RequestFlowVisualization;
