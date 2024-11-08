// app/routes/objects+/actions.tsx

import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { NewMain } from "~/components/NewMain";
import { db } from "~/db";
import { enrichAction } from "~/db/schema";

export async function loader() {
  const actions = await db.query.actions.findMany({
    with: {
      calls: {
        orderBy: (calls, { desc }) => [desc(calls.createdAt)],
        limit: 1,
      },
    },
  });

  const enrichedActions = actions.map((action) => ({
    ...enrichAction(action),
    lastCallStatus: action.calls[0]?.status || "never_run",
    lastRunAt: action.calls[0]?.createdAt || null,
    totalCalls: action.calls.length,
  }));

  return json({ data: enrichedActions });
}

export default function ActionsObjectRoute() {
  const { data } = useLoaderData<typeof loader>();
  return <NewMain data={data} />;
}
