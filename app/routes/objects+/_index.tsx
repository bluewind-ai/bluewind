// app/routes/objects+/_index.tsx
import { type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { eq } from "drizzle-orm";

import { ActionButtons } from "~/components/action-buttons";
import { BackOfficeTree } from "~/components/back-office-tree";
import { type NavigationNode, NavigationTree } from "~/components/navigation-tree";
import { NewMain } from "~/components/new-main";
import { apps, functionCalls, serverFunctions } from "~/db/schema";
import type { FunctionCall } from "~/db/schema/function-calls/schema";
import { createBackOfficeTree } from "~/functions/create-back-office-tree.server";
import { loadObjectsTable } from "~/functions/load-objects-table.server";

type FunctionCallWithRelations = FunctionCall & {
  objects: Array<{
    id: number;
  }>;
  action: {
    id: number;
  };
};
async function _loader(args: LoaderFunctionArgs) {
  const { db } = args.context;
  const url = new URL(args.request.url);
  const functionCallId = url.searchParams.get("function-call-id") || undefined;
  const tableObjects = await loadObjectsTable(db, { functionCallId });
  const masterAction = await db.query.serverFunctions.findFirst({
    where: eq(serverFunctions.name, "master"),
  });
  if (!masterAction) {
    return {
      navigationData: {
        id: 0,
        name: "Objects",
        type: "root",
        iconKey: "database",
        children: [],
      } as NavigationNode,
      backOfficeData: createBackOfficeTree(),
      apps: [],
      objects: tableObjects,
    };
  }
  const functionCallsData = await db.query.functionCalls.findMany({
    with: {
      action: true,
      objects: true,
    },
    orderBy: functionCalls.createdAt,
  });
  const navigationData: NavigationNode = {
    id: 0,
    name: "Objects",
    type: "root",
    iconKey: "database",
    children: functionCallsData
      .filter((call: FunctionCallWithRelations) => call.objects.length > 0)
      .map((functionCall: FunctionCallWithRelations, index: number) => ({
        id: index + 1,
        name: `Call ${functionCall.id} Objects`,
        to: `/objects/${functionCall.id}`,
        type: "file" as const,
        children: [] as NavigationNode[],
      })),
  };
  const appsData = await db.select().from(apps).orderBy(apps.order);
  return {
    navigationData,
    backOfficeData: createBackOfficeTree(),
    apps: appsData,
    objects: tableObjects,
  };
}
export async function loader(args: LoaderFunctionArgs) {
  return await _loader(args);
}
export default function Objects() {
  const { navigationData, backOfficeData, apps, objects } = useLoaderData<typeof loader>();
  return (
    <div className="flex h-full">
      <NavigationTree data={navigationData} apps={apps} />
      <div className="flex-1">
        <ActionButtons />
        <NewMain data={objects} />
        <Outlet />
      </div>
      <BackOfficeTree data={backOfficeData} apps={apps} />
    </div>
  );
}
