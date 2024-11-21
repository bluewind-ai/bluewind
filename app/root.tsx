// app/root.tsx

import "./tailwind.css";

import { LoaderFunctionArgs } from "@remix-run/node";
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from "@remix-run/react";

import { BackOfficeTree } from "./components/back-office-tree";
import { NavigationTree } from "./components/navigation-tree";
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

export { ErrorBoundary } from "./root-error-boundary";

export default function App() {
  const { navigationData, backOfficeData } = useLoaderData<typeof loader>();
  return (
    <Document>
      <div className="flex h-full overflow-hidden">
        <NavigationTree data={navigationData} />
        <div className="flex-1">
          <ServerFunctionsButtons />
          <Outlet />
        </div>
        <BackOfficeTree data={backOfficeData} />
      </div>
    </Document>
  );
}

export async function loader(args: LoaderFunctionArgs) {
  // Check for error in context and throw it to trigger error boundary
  if (args.context.error) {
    throw args.context.error;
  }
  return loadNavigationData(args);
}
