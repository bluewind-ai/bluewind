// app/routes/debug/route.tsx

import { json, type LoaderFunction } from "@remix-run/node";
import { useLoaderData, useRevalidator } from "@remix-run/react";
import { db } from "~/db";
import { debugLogs } from "~/db/schema";
import { desc } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { useEffect } from "react";

type DebugLog = InferSelectModel<typeof debugLogs>;

export const loader: LoaderFunction = async () => {
  const logs = await db.select().from(debugLogs).orderBy(desc(debugLogs.createdAt)).limit(50);
  return json(logs);
};

export default function DebugPanel() {
  const logs = useLoaderData<typeof loader>();
  const { revalidate } = useRevalidator();

  useEffect(() => {
    const interval = setInterval(() => {
      revalidate();
    }, 1000);

    return () => clearInterval(interval);
  }, [revalidate]);

  return (
    <div className="flex min-h-screen">
      <div className="flex flex-1">
        <div>Main content area</div>
      </div>
      <div className="w-[500px] border-l bg-[#1e1e1e]">
        <div className="h-full text-green-400 font-mono p-4 overflow-auto">
          <h1 className="text-2xl mb-6">Debug Panel ({logs.length} logs)</h1>
          <div className="space-y-6">
            {logs.map((log: DebugLog) => (
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
  );
}
