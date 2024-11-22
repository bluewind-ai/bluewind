// app/root.tsx

import "./tailwind.css";

import { LoaderFunctionArgs } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";

import { BackOfficeTree } from "./components/back-office-tree";
import { type NavigationNode, NavigationTree } from "./components/navigation-tree";
import { ServerFunctionsButtons } from "./components/server-functions-buttons";
import { loadNavigationData } from "./functions/load-navigation-data.server";

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

export { RemixErrorBoundary as ErrorBoundary } from "~/utils/error-utils";

interface LoaderData {
  navigationData: NavigationNode;
  backOfficeData: NavigationNode;
  apps: NavigationNode[];
}

export async function loader(args: LoaderFunctionArgs): Promise<LoaderData> {
  if (args.context.error) {
    throw args.context.error;
  }

  const data = await loadNavigationData(args);
  if (!data?.navigationData || !data?.backOfficeData) {
    throw new Response(JSON.stringify({ message: "Failed to load navigation data" }), {
      status: 500,
    });
  }

  return {
    navigationData: data.navigationData,
    backOfficeData: data.backOfficeData,
    apps: data.apps || [],
  };
}

function LoadingUI() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-lg">Loading...</div>
    </div>
  );
}

function AppContent({ data }: { data: LoaderData }) {
  return (
    <div className="flex h-full overflow-hidden">
      <NavigationTree data={data.navigationData} />
      <div className="flex-1">
        <ServerFunctionsButtons />
        <Outlet />
      </div>
      <BackOfficeTree data={data.backOfficeData} />
    </div>
  );
}

export default function App() {
  const data = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  return (
    <Document>
      {navigation.state === "loading" || !data ? (
        <LoadingUI />
      ) : (
        <AppContent data={data as LoaderData} />
      )}
    </Document>
  );
}
