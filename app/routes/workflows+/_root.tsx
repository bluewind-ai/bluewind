// app/routes/workflows+/_root.tsx

import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { NavigationTree, type NavigationNode } from "~/components/NavigationTree";
import { apps, actionCalls, actions } from "~/db/schema";
import { db } from "~/db";
import { eq, and, isNull } from "drizzle-orm";

export async function loader({ request: _request }: LoaderFunctionArgs) {
  // First get the master action ID
  const masterAction = await db.query.actions.findFirst({
    where: eq(actions.name, "master"),
  });

  if (!masterAction) {
    throw new Error("Master action not found");
  }

  // Get master action calls and their children
  const actionCallsData = await db.query.actionCalls.findMany({
    where: and(eq(actionCalls.actionId, masterAction.id), isNull(actionCalls.parentId)),
    with: {
      action: true,
    },
    orderBy: actionCalls.createdAt,
  });

  const navigationData: NavigationNode = {
    id: 0,
    name: "Workflows",
    type: "root",
    iconKey: "database",
    children: actionCallsData.map((actionCall, index) => ({
      id: index + 1,
      name: `Master ${actionCall.id}`,
      urlName: `/objects/action-calls/${actionCall.id}`,
      type: "file" as const,
      children: [] as NavigationNode[],
    })),
  };

  const appsData = await db.select().from(apps).orderBy(apps.order);

  return json({
    navigationData,
    apps: appsData,
  });
}

export default function WorkflowsRoot() {
  const { navigationData, apps } = useLoaderData<typeof loader>();

  return (
    <div className="flex h-full">
      <NavigationTree data={navigationData as NavigationNode} apps={apps} />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
