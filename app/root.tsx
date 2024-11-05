// app/root.tsx

import { Links, Meta, Outlet, Scripts, ScrollRestoration, useRouteError } from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import styles from "~/styles/globals.css?url";
import { dd, DDError } from "~/lib/debug";
import { ActivityBar } from "~/components/activity-bar";
import { db } from "~/db";
import { actionCalls } from "~/db/schema";
import { desc } from "drizzle-orm";

export const loader = async () => {
  const [lastAction] = await db.select().from(actionCalls).orderBy(desc(actionCalls.id)).limit(1);

  return json({ lastAction });
};

// Make dd available globally in browser
if (typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).dd = dd;
}

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  { rel: "stylesheet", href: styles },
];

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

  if (error instanceof DDError) {
    return (
      <Document>
        <div className="text-red-500">{error.message}</div>
      </Document>
    );
  }

  return (
    <Document>
      <div className="text-red-500">
        <h1>Oops! Something went wrong.</h1>
        <p>{error instanceof Error ? error.message : "Unknown error"}</p>
      </div>
    </Document>
  );
}

export default function App() {
  return (
    <Document>
      <div className="flex h-full">
        <ActivityBar />
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </Document>
  );
}
