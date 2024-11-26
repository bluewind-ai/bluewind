// app/routes/requests.$id.tsx

import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { eq } from "drizzle-orm";

import { requests } from "~/db/schema";
import { db } from "~/middleware/main";

export async function loader({ params }: LoaderFunctionArgs) {
  const requestId = Number(params.id);

  const request = await db.query.requests.findFirst({
    where: eq(requests.id, requestId),
  });

  if (!request) {
    throw new Response("Request not found", { status: 404 });
  }

  return json({ request });
}

export default function Request() {
  const { request } = useLoaderData<typeof loader>();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Request {request.id}</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
          <dt className="font-semibold">ID:</dt>
          <dd>{request.id}</dd>

          <dt className="font-semibold">Request ID:</dt>
          <dd>{request.requestId}</dd>

          <dt className="font-semibold">Function Call ID:</dt>
          <dd>{request.functionCallId}</dd>

          <dt className="font-semibold">Pathname:</dt>
          <dd>{request.pathname}</dd>
        </dl>
      </div>
    </div>
  );
}
