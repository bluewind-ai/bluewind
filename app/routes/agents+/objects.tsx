// app/routes/agents+/objects.tsx

import { type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { eq } from "drizzle-orm";

import { GenericTableView } from "~/components/generic-table-view";
import { Button } from "~/components/ui/button";
import { db } from "~/db";
import { functionCalls } from "~/db/schema";
import { loaderMiddleware } from "~/lib/middleware";

async function _loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const functionCallId = url.searchParams.get("function-call-id");
  if (!functionCallId) {
    throw new Error("Function call ID is required");
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

  return { functionCall, data: objectsList };
}

export async function loader(args: LoaderFunctionArgs) {
  return await loaderMiddleware(args, () => _loader(args));
}

export default function ObjectsRoute() {
  const { functionCall, data } = useLoaderData<typeof loader>();

  const extraColumns = [
    {
      id: "actions",
      header: "Actions",
      cell: (row: any) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              window.location.href = `/agents/${row.model}/${row.recordId}`;
            }}
          >
            View Record
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">
        Objects for Function Call {functionCall.id} ({functionCall.action.name})
      </h1>
      <GenericTableView data={data} extraColumns={extraColumns} />
    </div>
  );
}
