// app/root.tsx

import { json, type LinksFunction, type LoaderFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import stylesheet from "~/tailwind.css";
import { desc } from "drizzle-orm";
import { db } from "./db";
import { debugLogs } from "./db/schema";
import type { InferSelectModel } from "drizzle-orm";

type DebugLog = InferSelectModel<typeof debugLogs>;
type SerializedDebugLog = Omit<DebugLog, "createdAt"> & {
  createdAt: string;
};

export const links: LinksFunction = () => [{ rel: "stylesheet", href: stylesheet }];

export const loader = async () => {
  console.log("🟢 Root Loader starting");
  const logs = await db.select().from(debugLogs).orderBy(desc(debugLogs.createdAt)).limit(50);
  const serializedLogs: SerializedDebugLog[] = logs.map((log) => ({
    ...log,
    createdAt: log.createdAt.toISOString(),
  }));
  console.log("🟢 Fetched debug logs:", serializedLogs);
  return json({ logs: serializedLogs });
};

function Debug() {
  const { logs } = useLoaderData<typeof loader>();

  return (
    <div className="w-[500px] border-l bg-[#1e1e1e]">
      <div className="h-full text-green-400 font-mono p-4 overflow-auto">
        <h1 className="text-2xl mb-6">Debug Panel</h1>
        <div className="space-y-6">
          {logs.map((log) => (
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
  );
}

export default function App() {
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
          <Outlet />
          <Debug />
        </div>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
