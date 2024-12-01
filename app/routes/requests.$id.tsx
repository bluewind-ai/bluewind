// app/routes/requests.$id.tsx
import "@xyflow/react/dist/style.css";
import "react18-json-view/src/style.css";

import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useState } from "react";
import JsonView from "react18-json-view";

import RequestFlowVisualization from "~/components/RequestFlowVisualization";
import { getRequestTreeAndStoreCassette } from "~/functions/get-request-tree-and-store-cassette.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const requestId = Number(params.id);
  const request = await getRequestTreeAndStoreCassette(requestId);
  if (!request) {
    throw new Response("Request not found", { status: 404 });
  }
  return json(request);
}
export default function Request() {
  const request = useLoaderData<typeof loader>();
  const [viewMode, setViewMode] = useState<"tree" | "flow">("tree");
  return (
    <div className="p-4">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Request Tree</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("tree")}
                className={`px-3 py-1 rounded ${viewMode === "tree" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700"}`}
              >
                Tree View
              </button>
              <button
                onClick={() => setViewMode("flow")}
                className={`px-3 py-1 rounded ${viewMode === "flow" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700"}`}
              >
                Flow View
              </button>
            </div>
          </div>

          <div
            className={
              viewMode === "flow"
                ? "h-[600px] border-2 border-gray-200"
                : "max-h-[80vh] overflow-y-auto"
            }
          >
            {viewMode === "flow" ? (
              <RequestFlowVisualization data={request} />
            ) : (
              <JsonView
                src={request}
                theme="vscode"
                displaySize={true}
                enableClipboard={true}
                collapseStringsAfterLength={100}
                displayObjectSize={true}
                collapsed={1}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
