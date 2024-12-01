// app/components/RequestFlowVisualization.tsx

import "@xyflow/react/dist/style.css";

import { Background, Controls, Panel, ReactFlow } from "@xyflow/react";
import { useEffect } from "react";

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
      position: { x: number; y: number };
      data: {
        label: string;
        pathname: string;
        duration: number;
        requestSize: number;
        responseSize: number | null;
        objects: any[];
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

const RequestFlowVisualization = ({ data }: RequestFlowVisualizationProps) => {
  useEffect(() => {
    console.log("Flow received data:", data);
    console.log("Nodes:", data.nodes);
    console.log("Edges:", data.edges);
  }, [data]);

  try {
    return (
      <div className="w-full h-full min-h-[600px]" style={{ height: "100%", minHeight: "600px" }}>
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
          onError={(error) => console.error("ReactFlow error:", error)}
        >
          <Background />
          <Controls showInteractive={false} />
          <Panel position="top-left" className="bg-white/75 p-2 rounded text-sm">
            Scroll to pan, Pinch/Ctrl+Scroll to zoom
          </Panel>
        </ReactFlow>
      </div>
    );
  } catch (error) {
    console.error("Visualization error:", error);
    return <div>Error rendering flow: {String(error)}</div>;
  }
};

export default RequestFlowVisualization;
