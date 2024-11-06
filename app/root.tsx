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
import DebugPanel from "~/routes/debug-panel";

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
      <div className="p-4 font-mono">
        <pre className="text-red-500">
          {isRouteErrorResponse(error)
            ? `${error.status} ${error.statusText}\n${error.data}`
            : error instanceof Error
              ? `${error.name}: ${error.message}\n\n${error.stack}`
              : JSON.stringify(error, null, 2)}
        </pre>
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
