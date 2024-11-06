// app/root.tsx

import { json, type LinksFunction } from "@remix-run/node";
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from "@remix-run/react";
import { db } from "~/db";
import { debugLogs } from "~/db/schema";
import { desc } from "drizzle-orm";

import tailwindStylesheetUrl from "./tailwind.css?url";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: tailwindStylesheetUrl }];

type SerializedDebugLog = {
  id: number;
  message: string;
  createdAt: string;
};

export const loader = async () => {
  console.log("🟢 Root loader starting");
  const logs = await db.select().from(debugLogs).orderBy(desc(debugLogs.createdAt)).limit(50);
  console.log("🟢 Fetched debug logs:", logs);
  return json({ logs });
};

export default function App() {
  const { logs } = useLoaderData<typeof loader>();
  console.log("🟢 Root route data:", logs);

  return (
    <AppLayout>
      <div className="flex min-h-screen">
        <div className="flex-1">
          <Outlet />
        </div>
        <div className="w-[500px] border-l bg-[#1e1e1e]">
          <div className="h-full text-green-400 font-mono p-4 overflow-auto">
            <h1 className="text-2xl mb-6">Debug Panel</h1>
            <div className="space-y-6">
              {logs.map((log: SerializedDebugLog) => (
                <div key={log.id} className="border border-green-400/20 rounded p-4">
                  <div className="text-xs text-green-400/60 mb-2">
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                  <pre className="whitespace-pre-wrap">{log.message}</pre>
                </div>
              ))}
            </div>
          </div>
        </div>
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
      </body>
    </html>
  );
}
