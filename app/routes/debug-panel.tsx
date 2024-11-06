// app/routes/debug-panel.tsx

import { useFetcher } from "@remix-run/react";
import { db } from "~/db";
import { debugLogs } from "~/db/schema";
import { desc } from "drizzle-orm";
import { json } from "@remix-run/server-runtime";
import type { InferSelectModel } from "drizzle-orm";
import { useEffect } from "react";

type DebugLog = InferSelectModel<typeof debugLogs>;
type SerializedDebugLog = Omit<DebugLog, "createdAt"> & {
  createdAt: string;
};

export async function loader() {
  const logs = await db.select().from(debugLogs).orderBy(desc(debugLogs.createdAt)).limit(1);
  const serializedLogs: SerializedDebugLog[] = logs.map((log) => ({
    ...log,
    createdAt: log.createdAt.toISOString(),
  }));
  return json({ logs: serializedLogs });
}

export default function DebugPanel() {
  const fetcher = useFetcher<typeof loader>();

  useEffect(() => {
    fetcher.load("/debug-panel");
  }, [fetcher]);

  const logs = fetcher.data?.logs ?? [];

  return (
    <div className="w-[500px] border-l bg-[#1e1e1e] overflow-auto">
      <div className="text-green-400 font-mono p-4">
        <h1 className="text-2xl mb-6">Debug Panel</h1>
        <div className="space-y-6">
          {logs.map((log) => {
            const data = JSON.parse(log.message);
            return (
              <div key={log.id} className="border border-green-400/20 rounded p-4">
                <div className="text-xs text-green-400/60 mb-2">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
                <div>
                  <div className="text-sm text-green-400/80 mb-1">Type: {data.type}</div>
                  <div className="text-sm text-green-400/80 mb-2">Message: {data.message}</div>
                  <pre className="whitespace-pre-wrap text-sm">
                    {JSON.stringify(data.data, null, 2)}
                  </pre>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
