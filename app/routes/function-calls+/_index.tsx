// app/routes/function-calls+/_index.tsx
import { type ActionFunctionArgs, type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Outlet, useFetcher, useLoaderData } from "@remix-run/react";
import { and, eq, isNull } from "drizzle-orm";

import { BackOfficeTree } from "~/components/back-office-tree";
import { type NavigationNode, NavigationTree } from "~/components/navigation-tree";
import { Button } from "~/components/ui/button";
import { db } from "~/db";
import { apps, functionCalls, getTableMetadata, serverFunctions } from "~/db/schema";
import { type ActionContext, contextStore } from "~/lib/action-builder.server";
import { actions } from "~/lib/actions.server";
import { actionMiddleware, loaderMiddleware } from "~/lib/middleware";

async function _loader(_args: LoaderFunctionArgs) {
  const masterAction = await db.query.serverFunctions.findFirst({
    where: eq(serverFunctions.name, "master"),
  });
  // this should be removed by YOU when you rewrite the filed;
  if (!masterAction) {
    return {
      navigationData: {
        id: 0,
        name: "Function Calls",
        type: "root",
        iconKey: "database",
        children: [],
      } as NavigationNode,
      backOfficeData: {
        id: 0,
        name: "Database",
        type: "root",
        iconKey: "database",
        children: getTableMetadata().map((table, index) => ({
          id: index + 1,
          name: table.displayName,
          to: `/back-office/${table.urlName}`,
          type: "file" as const,
          children: [] as NavigationNode[],
        })),
      } as NavigationNode,
      apps: [],
    };
  }
  const functionCallsData = await db.query.functionCalls.findMany({
    where: and(eq(functionCalls.actionId, masterAction.id), isNull(functionCalls.parentId)),
    with: {
      action: true,
    },
    orderBy: functionCalls.createdAt,
  });
  // this should be removed by YOU when you rewrite the filed;
  const navigationData: NavigationNode = {
    id: 0,
    name: "Function Calls",
    type: "root",
    iconKey: "database",
    children: functionCallsData.map((functionCall, index) => ({
      id: index + 1,
      name: `Master ${functionCall.id}`,
      to: `/function-calls/${functionCall.id}`,
      type: "file" as const,
      children: [] as NavigationNode[],
    })),
  };
  const backOfficeData: NavigationNode = {
    id: 0,
    name: "Database",
    type: "root",
    iconKey: "database",
    children: getTableMetadata().map((table, index) => ({
      id: index + 1,
      name: table.displayName,
      to: `/back-office/${table.urlName}`,
      type: "file" as const,
      children: [] as NavigationNode[],
    })),
  };
  const appsData = await db.select().from(apps).orderBy(apps.order);
  // this should be removed by YOU when you rewrite the filed;
  return {
    navigationData,
    backOfficeData,
    apps: appsData,
  };
}
async function _action(args: ActionFunctionArgs) {
  const formData = await args.request.formData();
  const name = formData.get("name") as keyof typeof actions;
  const functionCall = await db.query.functionCalls.findFirst({
    where: eq(functionCalls.id, 1), // For now use master call
    with: {
      action: true,
    },
  });
  if (!functionCall) {
    return null;
  }
  const context: ActionContext = {
    currentNode: {
      ...functionCall,
      actionName: functionCall.action.name,
      children: [],
    },
    hitCount: 0,
  };
  await contextStore.run(context, async () => {
    const action = actions[name];
    if (!action) {
      return null;
    }
    return await action();
  });
  await new Promise((resolve) => setTimeout(resolve, 3000));
  return redirect("/");
}
export async function loader(args: LoaderFunctionArgs) {
  return await loaderMiddleware(args, () => _loader(args));
}
export async function action(args: ActionFunctionArgs) {
  return await actionMiddleware(args, () => _action(args));
}
export default function FunctionCalls() {
  const { navigationData, backOfficeData, apps } = useLoaderData<typeof loader>();
  const goNextFetcher = useFetcher();
  const loadFilesFetcher = useFetcher();
  const resetFetcher = useFetcher();
  const isResetting = resetFetcher.state !== "idle";
  return (
    <div className="flex h-full">
      <NavigationTree data={navigationData} apps={apps} />
      <div className="flex-1">
        <div className="flex gap-2 p-4 flex-wrap">
          <goNextFetcher.Form method="post" action="/function-calls">
            <input type="hidden" name="name" value="go-next" />
            <Button type="submit" variant="outline" disabled={goNextFetcher.state !== "idle"}>
              {goNextFetcher.state !== "idle" ? "Running..." : "Go Next"}
            </Button>
          </goNextFetcher.Form>

          <loadFilesFetcher.Form method="post" action="/function-calls">
            <input type="hidden" name="name" value="load-files" />
            <Button type="submit" variant="outline" disabled={loadFilesFetcher.state !== "idle"}>
              {loadFilesFetcher.state !== "idle" ? "Loading..." : "Load Files"}
            </Button>
          </loadFilesFetcher.Form>

          <resetFetcher.Form method="post" action="/api/reset-all">
            <Button variant="destructive" type="submit" disabled={isResetting}>
              {isResetting ? "Resetting..." : "Reset All"}
            </Button>
          </resetFetcher.Form>
        </div>
        <Outlet />
      </div>
      <BackOfficeTree data={backOfficeData} apps={apps} />
    </div>
  );
}
