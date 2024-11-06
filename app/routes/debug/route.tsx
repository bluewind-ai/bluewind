// app/routes/debug/route.tsx

import { json, type LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { db } from "~/db";
import { debugLogs } from "~/db/schema";
import { desc } from "drizzle-orm";

type SerializedDebugLog = {
  id: number;
  message: string;
  createdAt: string;
};

export const loader: LoaderFunction = async () => {
  console.log("🟢 Debug Panel Loader starting");
  const logs = await db.select().from(debugLogs).orderBy(desc(debugLogs.createdAt)).limit(50);
  console.log("🟢 Fetched debug logs:", logs);
  return json({ logs });
};

export function Debug() {
  const { logs } = useLoaderData<typeof loader>();

  return (
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
  );
}

export default Debug;
