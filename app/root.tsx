// app/root.tsx

import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
  useLoaderData,
} from "@remix-run/react";
import "./tailwind.css";
import Debug from "~/routes/debug/route";
import { ActivityBar } from "~/components/ActivityBar";
import { db } from "~/db";
import { actionCalls } from "~/db/schema";
import { eq } from "drizzle-orm";
import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";

export const loader: LoaderFunction = async () => {
  const lastAction = await db.query.actionCalls.findFirst({
    where: eq(actionCalls.status, "ready_for_approval"),
    with: { action: true },
  });

  return json({ lastAction });
};

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
          <Debug />
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
  const { lastAction } = useLoaderData<typeof loader>();

  return (
    <Document>
      <div className="flex h-full">
        <ActivityBar lastAction={lastAction} />
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </Document>
  );
}
