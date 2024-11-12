// app/routes/agents+/_root.tsx

import { type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useFetcher, useLoaderData } from "@remix-run/react";
import { and, eq, isNull } from "drizzle-orm";

import { type NavigationNode, NavigationTree } from "~/components/navigation-tree";
import { Button } from "~/components/ui/button";
import { db } from "~/db";
import { actions, apps, functionCalls } from "~/db/schema";
import { loaderMiddleware } from "~/lib/middleware";

async function _loader(_args: LoaderFunctionArgs) {
  const masterAction = await db.query.actions.findFirst({
    where: eq(actions.name, "master"),
  });

  console.log("masterAction:", masterAction);

  if (!masterAction) {
    return {
      navigationData: {
        id: 0,
        name: "Agents",
        type: "root",
        iconKey: "database",
        children: [],
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

  console.log("functionCallsData:", functionCallsData);

  const navigationData: NavigationNode = {
    id: 0,
    name: "Agents",
    type: "root",
    iconKey: "database",
    children: functionCallsData.map((functionCall, index) => ({
      id: index + 1,
      name: `Master ${functionCall.id}`,
      to: `/agents/objects?function-call-id=${functionCall.id}`,
      type: "file" as const,
      children: [] as NavigationNode[],
    })),
  };

  const appsData = await db.select().from(apps).orderBy(apps.order);
  console.log("appsData:", appsData);

  return {
    navigationData,
    apps: appsData,
  };
}

export async function loader(args: LoaderFunctionArgs) {
  return await loaderMiddleware(args, () => _loader(args));
}

export default function AgentsRoot() {
  const { navigationData, apps } = useLoaderData<typeof loader>();
  const goNextFetcher = useFetcher();
  const loadFilesFetcher = useFetcher();
  const resetFetcher = useFetcher();

  const isResetting = resetFetcher.state !== "idle";

  const buttons = Array.from({ length: 1 }, (_, i) => (
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
        <div className="flex gap-2 p-4 flex-wrap">
          <goNextFetcher.Form method="post" action="/run-function/go-next">
            <Button type="submit" variant="outline" disabled={goNextFetcher.state !== "idle"}>
              {goNextFetcher.state !== "idle" ? "Running..." : "Go Next"}
            </Button>
          </goNextFetcher.Form>

          <loadFilesFetcher.Form method="post" action="/run-function/load-files">
            <Button type="submit" variant="outline" disabled={loadFilesFetcher.state !== "idle"}>
              {loadFilesFetcher.state !== "idle" ? "Loading..." : "Load Files"}
            </Button>
          </loadFilesFetcher.Form>

          {buttons}

          <resetFetcher.Form method="post" action="/api/reset-all">
            <Button variant="destructive" type="submit" disabled={isResetting}>
              {isResetting ? "Resetting..." : "Reset All"}
            </Button>
          </resetFetcher.Form>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
