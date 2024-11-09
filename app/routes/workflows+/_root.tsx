// app/routes/workflows+/_root.tsx

import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { NavigationTree, type NavigationNode } from "~/components/NavigationTree";
import { apps, actionCalls } from "~/db/schema";
import { db } from "~/db";

export async function loader({ request: _request }: LoaderFunctionArgs) {
  const actionCallsData = await db.query.actionCalls.findMany({
    orderBy: actionCalls.createdAt,
    with: {
      action: true,
    },
  });

  const navigationData: NavigationNode = {
    id: 0,
    name: "Workflows",
    type: "root",
    iconKey: "database",
    children: actionCallsData.map((actionCall, index) => ({
      id: index + 1,
      name: actionCall.action.name,
      urlName: `action-calls/${actionCall.id}`,
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
