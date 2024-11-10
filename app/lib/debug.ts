// app/lib/debug.ts

import { db } from "~/db";
import { debugLogs } from "~/db/schema";

type DebugInfo = {
  type: string;
  message: string;
  data: unknown;
};

function formatDebugInfo(data: unknown): DebugInfo {
  return {
    type: "Debug",
    message: "Debug Dump",
    data,
  };
}

export function dd(data: unknown): never {
  const debugInfo = formatDebugInfo(data);

  db.insert(debugLogs).values({
    message: JSON.stringify(debugInfo),
    functionCallId: 1,
  });

  throw new Response(JSON.stringify(debugInfo), {
    status: 500,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

declare global {
  // eslint-disable-next-line no-var
  var dd: (data: unknown) => never;
}

global.dd = dd;

export {};
