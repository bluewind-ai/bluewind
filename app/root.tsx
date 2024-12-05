// app/root.tsx
import "./tailwind.css";

import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react";

import { TableModel } from "~/db/schema/table-models";

import { type NavigationNode } from "./components/navigation-tree";
import { ServerFunctionsButtons } from "./components/server-functions-buttons";

("cdscds");
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
export interface LoaderData {
  navigationData: NavigationNode;
  backOfficeData: NavigationNode;
  apps: NavigationNode[];
  [TableModel.SERVER_FUNCTIONS]: Array<{
    id: number;
    name: string;
    type: string;
    metadata: {
      label: string;
      variant: string;
    };
  }>;
}
function LoadingUI() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-lg">Loading...</div>
    </div>
  );
}
function AppContent() {
  return (
    <div className="flex h-full overflow-hidden">
      {/* <NavigationTree data={data.navigationData} /> */}
      <div className="flex-1">
        <ServerFunctionsButtons />
        <Outlet />
      </div>
      {/* <BackOfficeTree data={data.backOfficeData} /> */}
    </div>
  );
}
export default function App() {
  return <Document>{<AppContent />}</Document>;
}
