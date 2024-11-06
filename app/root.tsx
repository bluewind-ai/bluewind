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

import tailwindStylesheetUrl from "./tailwind.css";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: tailwindStylesheetUrl }];

export default function App() {
  return (
    <AppLayout>
      <div className="flex min-h-screen">
        <Outlet />
      </div>
    </AppLayout>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        {children}
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 500 && error.data?.type === "Debug") {
    return (
      <AppLayout>
        <div className="flex min-h-screen">
          <div className="flex flex-1">
            <Outlet />
          </div>
          <div className="w-[500px] border-l bg-[#1e1e1e]">
            <div className="h-full text-green-400 font-mono p-4 overflow-auto">
              <pre className="whitespace-pre-wrap">{JSON.stringify(error, null, 2)}</pre>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  throw error;
}
