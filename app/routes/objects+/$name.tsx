// app/routes/objects+/$name.tsx

import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { db } from "~/db";
import { enrichAction } from "~/db/schema";
import { NewMain } from "~/components/NewMain";

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

      return json({ mainData: enrichedActions });
    }
    case "entities": {
      return json({ mainData: [] });
    }
    default:
      return json({ error: "Not found" }, { status: 404 });
  }
}

export default function ObjectsName() {
  const { mainData } = useLoaderData<typeof loader>();
  return <NewMain data={mainData} />;
}
