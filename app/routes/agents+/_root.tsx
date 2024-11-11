// app/routes/agents+/_root.tsx

import { type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useFetcher, useLoaderData, useNavigate } from "@remix-run/react";
import { and, eq, isNull } from "drizzle-orm";

import { type NavigationNode, NavigationTree } from "~/components/navigation-tree";
import { Button } from "~/components/ui/button";
import { db } from "~/db";
import { actions, apps, functionCalls } from "~/db/schema";
import { loaderMiddleware } from "~/lib/middleware";

// eslint-disable-next-line unused-imports/no-unused-vars
async function _loader(args: LoaderFunctionArgs) {
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
      to: `/agents/objects?function-call-id=${functionCall.id}`,
      type: "file" as const,
      children: [] as NavigationNode[],
    })),
  };

  const appsData = await db.select().from(apps).orderBy(apps.order);

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
  const fetcher = useFetcher();
  const navigate = useNavigate();

  const isResetting = fetcher.state !== "idle";

  const buttons = Array.from({ length: 7 }, (_, i) => (
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
          <Button onClick={() => navigate("/run-function/go-next")} variant="outline">
            Go Next
          </Button>
          <Button onClick={() => navigate("/run-function/load-files")} variant="outline">
            Load Files
          </Button>
          {buttons}
          <Button
            variant="destructive"
            onClick={() => {
              fetcher.submit(
                {},
                {
                  method: "post",
                  action: "/api/reset-all",
                },
              );
              setTimeout(() => {
                window.location.href = "/";
              }, 4000);
            }}
            disabled={isResetting}
          >
            {isResetting ? "Resetting..." : "Reset All"}
          </Button>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
