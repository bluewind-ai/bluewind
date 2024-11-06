// app/routes/action-calls._index.tsx

import { useLoaderData } from "@remix-run/react";
import { json, type LoaderFunction } from "@remix-run/node";
import { db } from "~/db";
import { actionCalls } from "~/db/schema";
import { desc } from "drizzle-orm";

export const loader: LoaderFunction = async () => {
  const calls = await db.query.actionCalls.findMany({
    orderBy: desc(actionCalls.id),
    with: { action: true },
  });

  return json({ calls });
};

export default function ActionCallsIndex() {
  const { calls } = useLoaderData<typeof loader>();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Action Calls</h1>
      <div className="space-y-4">
        {calls.map((call) => (
          <div key={call.id} className="p-4 border rounded">
            <div>ID: {call.id}</div>
            <div>Status: {call.status}</div>
            <div>Action: {call.action.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
