// app/routes/requests.$id.tsx

import "@xyflow/react/dist/style.css";
import "react18-json-view/src/style.css";

import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { eq } from "drizzle-orm";
import { useState } from "react";
import JsonView from "react18-json-view";

import RequestFlowVisualization from "~/components/RequestFlowVisualization";
import { requests } from "~/db/schema";
import { db } from "~/middleware/main";

export async function loader({ params }: LoaderFunctionArgs) {
  const requestId = Number(params.id);
  const [request] = await db.select().from(requests).where(eq(requests.id, requestId)).limit(1);

  if (!request) {
    throw new Response("Request not found", { status: 404 });
  }

  try {
    const treeData = JSON.parse(request.response);
    return json({ request, tree: treeData });
  } catch (error) {
    console.error("Error parsing response:", error);
    return json({ request, tree: null });
  }
}

export default function Request() {
  const { request, tree } = useLoaderData<typeof loader>();
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
                className={`px-3 py-1 rounded ${
                  viewMode === "tree" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700"
                }`}
              >
                Tree View
              </button>
              <button
                onClick={() => setViewMode("flow")}
                className={`px-3 py-1 rounded ${
                  viewMode === "flow" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700"
                }`}
              >
                Flow View
              </button>
            </div>
          </div>

          {tree ? (
            <div
              className={
                viewMode === "flow"
                  ? "h-[600px] border-2 border-gray-200"
                  : "max-h-[80vh] overflow-y-auto"
              }
            >
              {viewMode === "flow" ? (
                <RequestFlowVisualization data={tree} />
              ) : (
                <JsonView
                  src={tree}
                  theme="vscode"
                  displaySize={true}
                  enableClipboard={true}
                  collapseStringsAfterLength={100}
                  displayObjectSize={true}
                  collapsed={1}
                />
              )}
            </div>
          ) : (
            <p className="text-gray-500">No tree data available</p>
          )}
        </div>
      </div>
    </div>
  );
}
