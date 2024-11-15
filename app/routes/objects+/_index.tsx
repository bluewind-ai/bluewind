// app/routes/objects+/_index.tsx

import { type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useFetcher, useLoaderData } from "@remix-run/react";
import { eq } from "drizzle-orm";

import { BackOfficeTree } from "~/components/back-office-tree";
import { type NavigationNode, NavigationTree } from "~/components/navigation-tree";
import { NewMain } from "~/components/new-main";
import { Button } from "~/components/ui/button";
import { apps, functionCalls, getTableMetadata, serverFunctions } from "~/db/schema";
import type { FunctionCall } from "~/db/schema/function-calls/schema";
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
  // this should be removed by YOU when you rewrite the filed;
  if (!masterAction) {
    return {
      navigationData: {
        id: 0,
        name: "Objects",
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
  // this should be removed by YOU when you rewrite the filed;
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
    objects: tableObjects,
  };
}

export async function loader(args: LoaderFunctionArgs) {
  return await _loader(args);
}

export default function Objects() {
  const { navigationData, backOfficeData, apps, objects } = useLoaderData<typeof loader>();
  const goNextFetcher = useFetcher();
  const loadFilesFetcher = useFetcher();
  const resetFetcher = useFetcher();
  const truncateFetcher = useFetcher();
  const bootstrapFetcher = useFetcher();
  const isResetting = resetFetcher.state !== "idle";
  const isTruncating = truncateFetcher.state !== "idle";
  const isBootstrapping = bootstrapFetcher.state !== "idle";
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

          <truncateFetcher.Form method="post" action="/api/truncate-db">
            <Button variant="destructive" type="submit" disabled={isTruncating}>
              {isTruncating ? "Resetting..." : "Truncate DB"}
            </Button>
          </truncateFetcher.Form>

          <bootstrapFetcher.Form method="post" action="/api/bootstrap">
            <Button type="submit" variant="outline" disabled={isBootstrapping}>
              {isBootstrapping ? "Bootstrapping..." : "Bootstrap DB"}
            </Button>
          </bootstrapFetcher.Form>
        </div>
        <NewMain data={objects} />
        <Outlet />
      </div>
      <BackOfficeTree data={backOfficeData} apps={apps} />
    </div>
  );
}
