// app/root.tsx

import "./tailwind.css";

import { LoaderFunctionArgs } from "@remix-run/node";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteError,
} from "@remix-run/react";

import { BackOfficeTree } from "./components/back-office-tree";
import { NavigationNode, NavigationTree } from "./components/navigation-tree";
import { functionCalls } from "./db/schema";
import { createNavigationTrees } from "./functions/create-navigation-trees.server";

function Document({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  let errorOutput = "";
  if (isRouteErrorResponse(error)) {
    errorOutput = `${error.status} ${error.statusText}\n${JSON.stringify(error.data, null, 2)}`;
  } else if (error instanceof Error) {
    // Special handling for dd() calls
    if (error.message.startsWith("DD_DEBUG_BREAK: ")) {
      const [debugData, ...stackParts] = error.message
        .replace("DD_DEBUG_BREAK: ", "")
        .split("\n\n");
      const stack = stackParts.join("\n\n");
      const formattedStack = stack
        .split("\n")
        .map((line) => {
          if (!line.includes("debug.ts")) {
            // Skip debug.ts lines
            const match = line.match(/\((.*?):(\d+):(\d+)\)/) || line.match(/at (.*?):(\d+):(\d+)/);
            if (match) {
              const [_, filePath, line, col] = match;
              // Only include app paths
              if (filePath.includes("/app/")) {
                const cleanPath = filePath.replace("/Users/merwanehamadi/code/bluewind/", "");
                return `    at <a href="vscode://file${filePath}:${line}:${col}" class="text-blue-500 hover:underline">${cleanPath}:${line}:${col}</a>`;
              }
            }
          }
          return null;
        })
        .filter(Boolean)
        .join("\n");
      errorOutput = `${debugData}\n\n${formattedStack}`;
    } else {
      // Regular error handling
      const stackLines = error.stack
        ?.split("\n")
        .map((line) => {
          if (!line.includes("debug.ts")) {
            // Skip debug.ts lines
            const match = line.match(/\((.*?):(\d+):(\d+)\)/) || line.match(/at (.*?):(\d+):(\d+)/);
            if (match) {
              const [_, filePath, line, col] = match;
              // Only include app paths
              if (filePath.includes("/app/")) {
                const cleanPath = filePath.replace("/Users/merwanehamadi/code/bluewind/", "");
                return `    at <a href="vscode://file${filePath}:${line}:${col}" class="text-blue-500 hover:underline">${cleanPath}:${line}:${col}</a>`;
              }
            }
          }
          return null;
        })
        .filter(Boolean)
        .join("\n");
      errorOutput = `${error.name}: ${error.message}\n\n${stackLines}`;
    }
  } else {
    errorOutput = JSON.stringify(error, null, 2);
  }
  return (
    <Document>
      <div className="p-4 font-mono">
        <div
          className="text-red-500 whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: errorOutput }}
        />
      </div>
    </Document>
  );
}

export default function App() {
  const { navigationData, apps, backOfficeData } = useLoaderData<typeof loader>();
  return (
    <Document>
      <div className="flex h-full overflow-hidden">
        <NavigationTree data={navigationData} apps={apps} />
        <div className="flex-1">
          {/* <ServerFunctionsButtons />
        <NewMain data={mainData} /> */}
          <Outlet />
        </div>
        <BackOfficeTree data={backOfficeData} apps={apps} />

        {/* <BackOfficeTree data={backOfficeData} apps={apps} /> */}
      </div>
      {/*
      <div className="h-full overflow-hidden">
        <NavigationTree data={navigationData} apps={apps} />
        <Outlet />
      </div> */}
    </Document>
  );
}

export async function loader(args: LoaderFunctionArgs) {
  const { db } = args.context;
  const url = new URL(args.request.url);
  const parentId = url.searchParams.get("parent-id") || undefined;

  console.log("Loading function calls with parentId:", parentId);

  const { backOfficeData, apps } = await createNavigationTrees(db, {
    navigationName: "Objects",
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
    apps,
    backOfficeData,
  };
}
