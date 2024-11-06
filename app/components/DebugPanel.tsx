// app/components/DebugPanel.tsx

import { json } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import { useEffect, useRef } from "react";
import { db } from "~/db";
import { debugLogs } from "~/db/schema";
import { desc } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";

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

export function Debug() {
  const fetcher = useFetcher<typeof loader>();
  const lastLogsRef = useRef<SerializedDebugLog[]>([]);

  useEffect(() => {
    const poll = () => {
      fetcher.load("/debug-data");
    };

    poll();
    const interval = setInterval(poll, 1000);
    return () => clearInterval(interval);
  }, [fetcher]);

  const newLogs = fetcher.data?.logs ?? [];

  if (JSON.stringify(newLogs) !== JSON.stringify(lastLogsRef.current)) {
    lastLogsRef.current = newLogs;
  }

  const logs = lastLogsRef.current;

  return (
    <div className="w-[500px] border-l bg-[#1e1e1e] overflow-auto">
      <div className="text-green-400 font-mono p-4">
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
