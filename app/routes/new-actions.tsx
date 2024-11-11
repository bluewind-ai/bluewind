// app/routes/new-actions.tsx

import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { NewMain } from "~/components/new-main";
import { db } from "~/db";
import { enrichAction, functionCalls } from "~/db/schema";
import type { SQL } from "drizzle-orm";

type ActionRecord = {
  id: number;
  name: string;
  displayName: string;
  lastCallStatus: string;
  lastRunAt: Date | null;
  totalCalls: number;
};

export async function loader() {
  const actions = await db.query.actions.findMany({
    with: {
      calls: {
        orderBy: (calls: typeof functionCalls, { desc }: { desc: (col: SQL) => SQL }) => [
          desc(calls.createdAt),
        ],
        limit: 1,
      },
    },
  });

  const enrichedActions: ActionRecord[] = actions.map((action) => ({
    id: action.id,
    name: action.name,
    displayName: enrichAction(action).displayName,
    lastCallStatus: action.calls[0]?.status || "never_run",
    lastRunAt: action.calls[0]?.createdAt || null,
    totalCalls: action.calls.length,
  }));

  return json(
    { data: enrichedActions },
    {
      status: 200,
    },
  );
}

export default function NewActionsRoute() {
  const { data } = useLoaderData<typeof loader>();
  return <NewMain data={data} />;
}
