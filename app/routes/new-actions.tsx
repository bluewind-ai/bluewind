// app/routes/new-actions.tsx
import { type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { desc } from "drizzle-orm";

import { NewMain } from "~/components/new-main";
import { db } from "~/db";
import { enrichServerFunction, functionCalls } from "~/db/schema";
import { loaderMiddleware } from "~/lib/middleware";
import { type ActionRecord } from "~/types/action-record";
// eslint-disable-next-line unused-imports/no-unused-vars
async function _loader(args: LoaderFunctionArgs) {
  const actions = await db.query.serverFunctions.findMany({
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
    displayName: enrichServerFunction(action).displayName,
    lastCallStatus: action.calls?.[0]?.status || "never_run",
    lastRunAt: action.calls?.[0]?.createdAt?.toISOString() || null,
    totalCalls: action.calls?.length || 0,
  }));
  return {
    data: enrichedActions,
  };
}
export async function loader(args: LoaderFunctionArgs) {
  return await loaderMiddleware(args, () => _loader(args));
}
export default function NewActionsRoute() {
  const { data } = useLoaderData<typeof loader>();
  return <NewMain data={data} />;
}
