// app/routes/agents+/function-calls.$id.tsx

import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { db } from "~/db";
import { actionCalls } from "~/db/schema";
import { eq } from "drizzle-orm";

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;

  const actionCall = await db.query.actionCalls.findFirst({
    where: eq(actionCalls.id, parseInt(id!)),
    with: {
      action: true,
      parent: true,
    },
  });

  if (!actionCall) {
    throw new Error(`Action call ${id} not found`);
  }

  return json({ actionCall });
}

export default function FunctionCallRoute() {
  const { actionCall } = useLoaderData<typeof loader>();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Function Call {actionCall.id}</h1>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Action</h2>
          <p>{actionCall.action.name}</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Status</h2>
          <p>{actionCall.status}</p>
        </div>
        {actionCall.args && (
          <div>
            <h2 className="text-lg font-semibold">Arguments</h2>
            <pre className="bg-gray-100 p-2 rounded">
              {JSON.stringify(actionCall.args, null, 2)}
            </pre>
          </div>
        )}
        {actionCall.result && (
          <div>
            <h2 className="text-lg font-semibold">Result</h2>
            <pre className="bg-gray-100 p-2 rounded">
              {JSON.stringify(actionCall.result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
