// app/root.tsx

import { type LinksFunction } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
} from "@remix-run/react";
import "./tailwind.css";
import { Debug } from "~/routes/debug/route"; // Simple debug panel for root errors
import DebugPanel from "~/routes/debug-panel"; // Fancy debug panel for the app

function Document({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-full overflow-hidden">
        <div className="flex h-full">
          <div className="flex-1 overflow-auto">{children}</div>
          <DebugPanel />
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  return (
    <Document>
      <div className="p-4">
        <h1>Error</h1>
        {isRouteErrorResponse(error) ? (
          <div>
            <h2>
              {error.status} {error.statusText}
            </h2>
            <pre className="whitespace-pre-wrap">{JSON.stringify(error.data, null, 2)}</pre>
          </div>
        ) : error instanceof Error ? (
          <div>
            <h2>{error.message}</h2>
            <pre className="whitespace-pre-wrap">{error.stack}</pre>
          </div>
        ) : (
          <h2>Unknown Error</h2>
        )}
      </div>
    </Document>
  );
}

export default function App() {
  return (
    <Document>
      <Outlet />
    </Document>
  );
}
