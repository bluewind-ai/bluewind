// app/routes/objects+/_index.tsx

import { type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useFetcher, useLoaderData } from "@remix-run/react";
import { eq } from "drizzle-orm";

import { BackOfficeTree } from "~/components/back-office-tree";
import { type NavigationNode, NavigationTree } from "~/components/navigation-tree";
import { Button } from "~/components/ui/button";
import { db } from "~/db";
import { apps, functionCalls, getTableMetadata, serverFunctions } from "~/db/schema";
import { loaderMiddleware } from "~/lib/middleware";

async function _loader(_args: LoaderFunctionArgs) {
  const masterAction = await db.query.serverFunctions.findFirst({
    where: eq(serverFunctions.name, "master"),
  });

  console.log("masterAction:", masterAction);

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
    };
  }

  // Get all function calls that have objects
  const functionCallsData = await db.query.functionCalls.findMany({
    with: {
      action: true,
      objects: true,
    },
    orderBy: functionCalls.createdAt,
  });

  console.log("functionCallsData:", functionCallsData);

  const navigationData: NavigationNode = {
    id: 0,
    name: "Objects",
    type: "root",
    iconKey: "database",
    children: functionCallsData
      .filter((call) => call.objects.length > 0)
      .map((functionCall, index) => ({
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
  console.log("appsData:", appsData);

  return {
    navigationData,
    backOfficeData,
    apps: appsData,
  };
}

export async function loader(args: LoaderFunctionArgs) {
  return await loaderMiddleware(args, () => _loader(args));
}

export default function Objects() {
  const { navigationData, backOfficeData, apps } = useLoaderData<typeof loader>();
  const goNextFetcher = useFetcher();
  const loadFilesFetcher = useFetcher();
  const resetFetcher = useFetcher();
  const truncateFetcher = useFetcher();

  const isResetting = resetFetcher.state !== "idle";
  const isTruncating = truncateFetcher.state !== "idle";

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
        </div>
        <Outlet />
      </div>
      <BackOfficeTree data={backOfficeData} apps={apps} />
    </div>
  );
}
