// app/routes/objects+/_index.tsx

import { type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import type { NavigationNode } from "~/components/navigation-tree";
import { AdminLayout } from "~/components/ui/admin-root";
import { functionCalls } from "~/db/schema";
import type { FunctionCall } from "~/db/schema/function-calls/schema";
import { createNavigationTrees } from "~/functions/create-navigation-trees.server";
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

  const { backOfficeData, apps } = await createNavigationTrees(db, {
    navigationName: "Objects",
  });

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

  return {
    navigationData,
    backOfficeData,
    apps,
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
    <AdminLayout
      navigationData={navigationData}
      backOfficeData={backOfficeData}
      apps={apps}
      mainData={objects}
    />
  );
}
