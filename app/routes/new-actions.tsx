// app/routes/new-actions.tsx

import { type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { NewMain } from "~/components/new-main";
import { db } from "~/db";
import { enrichAction, functionCalls } from "~/db/schema";
import { desc } from "drizzle-orm";
import { beforeLoader } from "~/lib/middleware";

type ActionRecord = {
  id: number;
  name: string;
  displayName: string;
  lastCallStatus: string;
  lastRunAt: Date | null;
  totalCalls: number;
};

// eslint-disable-next-line unused-imports/no-unused-vars
async function _loader(args: LoaderFunctionArgs) {
  const actions = await db.query.actions.findMany({
    with: {
      calls: {
        orderBy: [desc(functionCalls.createdAt)],
        limit: 1,
      },
    },
  });

  const enrichedActions: ActionRecord[] = actions.map((action) => ({
    id: action.id,
    name: action.name,
    displayName: enrichAction(action).displayName,
    lastCallStatus: action.calls?.[0]?.status || "never_run",
    lastRunAt: action.calls?.[0]?.createdAt || null,
    totalCalls: action.calls?.length || 0,
  }));

  return {
    data: enrichedActions,
  };
}

export async function loader(args: LoaderFunctionArgs) {
  await beforeLoader(args);
  return await _loader(args);
}

export default function NewActionsRoute() {
  const { data } = useLoaderData<typeof loader>();
  return <NewMain data={data} />;
}
