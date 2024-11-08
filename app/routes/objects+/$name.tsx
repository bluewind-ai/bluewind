// app/routes/objects+/$name.tsx

import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { db } from "~/db";
import { enrichAction } from "~/db/schema";

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

      return json(enrichedActions);
    }
    case "entities": {
      // Handle entities route
      // You can add the logic for entities here
      return json([]);
    }
    default:
      return json({ error: "Not found" }, { status: 404 });
  }
}
