// app/routes/objects+/$name.tsx

import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { db } from "~/db";
import { enrichAction } from "~/db/schema";
import { NewMain } from "~/components/NewMain";

interface LoaderData {
  mainData: Array<{
    id: number;
    name: string;
    displayName: string;
    type: string;
    lastCallStatus: string;
    lastRunAt: string | null;
    totalCalls: number;
  }>;
}

export async function loader({ params }: LoaderFunctionArgs) {
  const { name } = params;

  switch (name) {
    case "actions": {
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

      return json<LoaderData>({ mainData: enrichedActions });
    }
    case "entities": {
      return json<LoaderData>({ mainData: [] });
    }
    default:
      throw new Response("Not Found", { status: 404 });
  }
}

export default function ObjectsName() {
  const { mainData } = useLoaderData<typeof loader>();
  return <NewMain data={mainData} />;
}
