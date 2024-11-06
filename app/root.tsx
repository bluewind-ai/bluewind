// app/root.tsx

import { type LinksFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
} from "@remix-run/react";
import stylesheet from "~/tailwind.css";
import { Debug } from "~/components/DebugPanel";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: stylesheet }];

function Document({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <div className="flex h-screen">
          {children}
          <Debug />
        </div>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  return (
    <Document>
      <div className="flex-1 p-4">
        <h1>Error</h1>
        {isRouteErrorResponse(error) ? (
          <div>
            <h2>
              {error.status} {error.statusText}
            </h2>
            <pre>{JSON.stringify(error.data, null, 2)}</pre>
          </div>
        ) : error instanceof Error ? (
          <div>
            <h2>{error.message}</h2>
            <pre>{error.stack}</pre>
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
