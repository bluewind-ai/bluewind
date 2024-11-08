// app/root.tsx

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
        <div className="flex h-full">
          <div className="flex-1">{children}</div>
        </div>
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
    errorOutput = `${error.name}: ${error.message}\n\n${error.stack}`;
  } else {
    errorOutput = JSON.stringify(error, null, 2);
  }

  return (
    <Document>
      <div className="p-4 font-mono">
        <pre className="text-red-500 whitespace-pre-wrap">{errorOutput}</pre>
      </div>
    </Document>
  );
}

export default function App() {
  return (
    <Document>
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </Document>
  );
}
