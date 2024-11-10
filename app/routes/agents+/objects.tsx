// app/routes/agents+/objects.tsx

import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { GenericTableView } from "~/components/generic-table-view";
import { db } from "~/db";
import { functionCalls } from "~/db/schema";
import { eq } from "drizzle-orm";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const functionCallId = url.searchParams.get("function-call-id");

  if (!functionCallId) {
    throw new Error("function-call-id is required");
  }

  const functionCall = await db.query.functionCalls.findFirst({
    where: eq(functionCalls.id, parseInt(functionCallId)),
    with: {
      action: true,
    },
  });

  if (!functionCall) {
    throw new Error(`Function call ${functionCallId} not found`);
  }

  const objectsList = await db.query.objects.findMany();

  return json({ functionCall, data: objectsList });
}

export default function ObjectsRoute() {
  const { functionCall, data } = useLoaderData<typeof loader>();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">
        Objects for Function Call {functionCall.id} ({functionCall.action.name})
      </h1>
      <GenericTableView data={data} />
    </div>
  );
}
