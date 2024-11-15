// app/routes/function-calls+/_index.tsx

import { type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";

import { BackOfficeTree } from "~/components/back-office-tree";
import { type NavigationNode, NavigationTree } from "~/components/navigation-tree";
import { NewMain } from "~/components/new-main";
import { ServerFunctionsButtons } from "~/components/server-functions-buttons";
import { functionCalls } from "~/db/schema";
import { createNavigationTrees } from "~/functions/create-navigation-trees.server";

async function _loader(args: LoaderFunctionArgs) {
  const { db } = args.context;
  const url = new URL(args.request.url);
  const parentId = url.searchParams.get("parent-id") || undefined;

  console.log("Loading function calls with parentId:", parentId);

  const { backOfficeData, apps } = await createNavigationTrees(db, {
    navigationName: "Function Calls",
  });

  const functionCallsData = await db.query.functionCalls.findMany({
    with: {
      serverFunction: true,
    },
    orderBy: functionCalls.createdAt,
  });

  const renderableFunctionCalls = functionCallsData.map((call) => ({
    id: call.id,
    serverFunctionId: call.serverFunctionId,
    requestId: call.requestId,
    parentId: call.parentId,
    status: call.status,
    createdAt: call.createdAt.toISOString(),
    args: call.args ? JSON.stringify(call.args) : null,
    result: call.result ? JSON.stringify(call.result) : null,
    serverFunctionName: call.serverFunction?.name || "Unknown",
  }));

  const navigationData: NavigationNode = {
    id: 0,
    name: "Function Calls",
    type: "root" as const,
    iconKey: "database",
    children: renderableFunctionCalls.map((functionCall, index: number) => ({
      id: index + 1,
      name: `Call ${functionCall.id}`,
      to: `/function-calls/${functionCall.id}`,
      type: "file" as const,
      children: [] as NavigationNode[],
    })),
  };

  return {
    navigationData,
    backOfficeData,
    apps,
    functionCalls: renderableFunctionCalls,
  };
}

export async function loader(args: LoaderFunctionArgs) {
  return await _loader(args);
}

export default function FunctionCalls() {
  const { navigationData, backOfficeData, apps, functionCalls } = useLoaderData<typeof loader>();

  console.log("Rendering FunctionCalls component with:", {
    navigationData,
    backOfficeData,
    appsCount: apps.length,
    functionCallsCount: functionCalls.length,
  });

  return (
    <div className="flex h-full">
      <NavigationTree data={navigationData} apps={apps} />
      <div className="flex-1">
        <ServerFunctionsButtons />
        <NewMain data={functionCalls} />
        <Outlet />
      </div>
      <BackOfficeTree data={backOfficeData} apps={apps} />
    </div>
  );
}
