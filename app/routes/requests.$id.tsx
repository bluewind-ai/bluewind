// app/routes/requests.$id.tsx

import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { eq } from "drizzle-orm";

import { requests } from "~/db/schema";
import { fetchWithContext } from "~/lib/fetch-with-context";
import { db } from "~/middleware/main";

export async function loader({ params, context }: LoaderFunctionArgs) {
  const requestId = Number(params.id);
  const [request] = await db.select().from(requests).where(eq(requests.id, requestId)).limit(1);
  if (!request) {
    throw new Response("Request not found", { status: 404 });
  }
  try {
    // Fetch the request tree using fetchWithContext
    const treeResponse = await fetchWithContext(context)(
      `http://localhost:5173/api/run-route/get-request-tree/${requestId}`,
    );
    if (!treeResponse.ok) {
      // If the response is not ok, return just the request without the tree
      return json({ request, tree: null });
    }
    const treeData = await treeResponse.json();
    return json({ request, tree: treeData.tree });
  } catch (error) {
    // If there's any error fetching the tree, return just the request
    return json({ request, tree: null });
  }
}
function RequestTree({ node }: { node: any }) {
  return (
    <div className="pl-4 border-l border-gray-200">
      <div className="py-2">
        <div className="font-medium">{node.pathname}</div>
        <div className="text-sm text-gray-500">Created at: {node.createdLocation}</div>
        {node.response && (
          <div className="text-sm mt-1 p-2 bg-gray-50 rounded">
            <div className="font-medium">Response:</div>
            <pre className="text-xs overflow-x-auto">
              {typeof node.response === "string"
                ? node.response
                : JSON.stringify(node.response, null, 2)}
            </pre>
          </div>
        )}
        {node.objects.length > 0 && (
          <div className="text-sm mt-1">
            <div className="font-medium">Objects:</div>
            <ul className="list-disc list-inside">
              {node.objects.map((obj: any, i: number) => (
                <li key={i}>
                  {obj.modelName} (Created at: {obj.createdLocation})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {node.children.length > 0 && (
        <div className="ml-4">
          {node.children.map((child: any, i: number) => (
            <RequestTree key={i} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}
export default function Request() {
  const { request, tree } = useLoaderData<typeof loader>();
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Request {request.id}</h1>
      <div className="bg-white shadow rounded-lg p-6 max-h-[80vh] overflow-y-auto">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 mb-6">
          <dt className="font-semibold">ID:</dt>
          <dd>{request.id}</dd>

          <dt className="font-semibold">Request ID:</dt>
          <dd>{request.requestId}</dd>

          <dt className="font-semibold">Function Call ID:</dt>
          <dd>{request.functionCallId}</dd>

          <dt className="font-semibold">Pathname:</dt>
          <dd>{request.pathname}</dd>
        </dl>

        <div className="border-t pt-4">
          <h2 className="text-xl font-semibold mb-4">Request Tree</h2>
          {tree ? (
            <RequestTree node={tree} />
          ) : (
            <p className="text-gray-500">No tree data available</p>
          )}
        </div>
      </div>
    </div>
  );
}
