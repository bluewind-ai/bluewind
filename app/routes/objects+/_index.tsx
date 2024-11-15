// app/routes/objects+/_index.tsx

import { type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { eq } from "drizzle-orm";

import { BackOfficeTree } from "~/components/back-office-tree";
import { type NavigationNode, NavigationTree } from "~/components/navigation-tree";
import { NewMain } from "~/components/new-main";
import { ServerFunctionsButtons } from "~/components/server-functions-buttons";
import { apps, functionCalls, serverFunctions } from "~/db/schema";
import type { FunctionCall } from "~/db/schema/function-calls/schema";
import { getTableMetadata } from "~/db/schema/table-models";
import { loadObjectsTable } from "~/functions/load-objects-table.server";

type FunctionCallWithRelations = FunctionCall & {
  objects: Array<{
    id: number;
  }>;
  serverFunction: {
    id: number;
  };
};

async function _loader(args: LoaderFunctionArgs) {
  const { db } = args.context;
  const url = new URL(args.request.url);
  const functionCallId = url.searchParams.get("function-call-id") || undefined;

  console.log("Loading objects table with functionCallId:", functionCallId);
  const tableObjects = await loadObjectsTable(db, { functionCallId });

  const masterAction = await db.query.serverFunctions.findFirst({
    where: eq(serverFunctions.name, "master"),
  });

  if (!masterAction) {
    return {
      navigationData: {
        id: 0,
        name: "Objects",
        type: "root" as const,
        iconKey: "database",
        children: [],
      } as NavigationNode,
      backOfficeData: {
        id: 0,
        name: "Database",
        type: "root" as const,
        iconKey: "database",
        children: getTableMetadata().map((table, index) => ({
          id: index + 1,
          name: table.displayName,
          to: `/${table.urlName}`,
          type: "file" as const,
          children: [] as NavigationNode[],
        })),
      } as NavigationNode,
      apps: [],
      objects: tableObjects,
    };
  }

  const functionCallsData = await db.query.functionCalls.findMany({
    with: {
      serverFunction: true,
      objects: true,
    },
    orderBy: functionCalls.createdAt,
  });

  const navigationData: NavigationNode = {
    id: 0,
    name: "Objects",
    type: "root" as const,
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

  console.log("Getting table metadata for BackOfficeTree");
  const tables = getTableMetadata();
  console.log("Table metadata:", tables);

  const backOfficeData: NavigationNode = {
    id: 0,
    name: "Database",
    type: "root" as const,
    iconKey: "database",
    children: tables.map((table, index) => ({
      id: index + 1,
      name: table.displayName,
      to: `/${table.urlName}`,
      type: "file" as const,
      children: [] as NavigationNode[],
    })),
  };

  console.log("Created BackOfficeTree data:", backOfficeData);

  return {
    navigationData,
    backOfficeData,
    apps: appsData,
    objects: tableObjects,
  };
}

export async function loader(args: LoaderFunctionArgs) {
  return await _loader(args);
}

export default function Objects() {
  const { navigationData, backOfficeData, apps, objects } = useLoaderData<typeof loader>();

  console.log("Rendering Objects component with:", {
    navigationData,
    backOfficeData,
    appsCount: apps.length,
    objectsCount: objects.length,
  });

  return (
    <div className="flex h-full">
      <NavigationTree data={navigationData} apps={apps} />
      <div className="flex-1">
        <ServerFunctionsButtons />
        <NewMain data={objects} />
        <Outlet />
      </div>
      <BackOfficeTree data={backOfficeData} apps={apps} />
    </div>
  );
}
