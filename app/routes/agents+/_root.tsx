// app/routes/agents+/_root.tsx

import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { NavigationTree, type NavigationNode } from "~/components/NavigationTree";
import { apps, functionCalls, actions } from "~/db/schema";
import { db } from "~/db";
import { eq, and, isNull } from "drizzle-orm";
import { Button } from "~/components/ui/button";

export async function loader({ request: _request }: LoaderFunctionArgs) {
  const masterAction = await db.query.actions.findFirst({
    where: eq(actions.name, "master"),
  });

  if (!masterAction) {
    throw new Error("Master action not found");
  }

  const functionCallsData = await db.query.functionCalls.findMany({
    where: and(eq(functionCalls.actionId, masterAction.id), isNull(functionCalls.parentId)),
    with: {
      action: true,
    },
    orderBy: functionCalls.createdAt,
  });

  const navigationData: NavigationNode = {
    id: 0,
    name: "Agents",
    type: "root",
    iconKey: "database",
    children: functionCallsData.map((functionCall, index) => ({
      id: index + 1,
      name: `Master ${functionCall.id}`,
      to: `/agents/function-calls/${functionCall.id}`, // We provide the full URL here
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

export default function AgentsRoot() {
  const { navigationData, apps } = useLoaderData<typeof loader>();

  const buttons = Array.from({ length: 8 }, (_, i) => (
    <Button
      key={i}
      onClick={() => window.open("https://www.google.com", "_blank")}
      variant="secondary"
    >
      Random Button {i + 1}
    </Button>
  ));

  return (
    <div className="flex h-full">
      <NavigationTree data={navigationData} apps={apps} />
      <div className="flex-1">
        <div className="flex gap-2 p-4 flex-wrap">{buttons}</div>
        <Outlet />
      </div>
    </div>
  );
}
