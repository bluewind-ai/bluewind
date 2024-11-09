// app/routes/agents+/function-calls.$id.tsx

import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { db } from "~/db";
import { functionCalls } from "~/db/schema";
import { eq } from "drizzle-orm";

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;

  const functionCall = await db.query.functionCalls.findFirst({
    where: eq(functionCalls.id, parseInt(id!)),
    with: {
      action: true,
      parent: true,
    },
  });

  if (!functionCall) {
    throw new Error(`Function call ${id} not found`);
  }

  return json({ functionCall });
}

export default function FunctionCallRoute() {
  const { functionCall } = useLoaderData<typeof loader>();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Function Call {functionCall.id}</h1>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Action</h2>
          <p>{functionCall.action.name}</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Status</h2>
          <p>{functionCall.status}</p>
        </div>
        {typeof functionCall.args === "object" && functionCall.args !== null && (
          <div>
            <h2 className="text-lg font-semibold">Arguments</h2>
            <pre className="bg-gray-100 p-2 rounded">
              {JSON.stringify(functionCall.args, null, 2)}
            </pre>
          </div>
        )}
        {typeof functionCall.result === "object" && functionCall.result !== null && (
          <div>
            <h2 className="text-lg font-semibold">Result</h2>
            <pre className="bg-gray-100 p-2 rounded">
              {JSON.stringify(functionCall.result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
