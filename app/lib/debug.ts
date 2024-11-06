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

export async function dd(data: unknown): Promise<never> {
  console.log("🟢 dd function called with data:", data);

  const debugInfo = formatDebugInfo(data);
  console.log("🟢 Formatted debug info:", debugInfo);

  console.log("🟡 Attempting to insert into debugLogs...");
  await db.insert(debugLogs).values({
    message: JSON.stringify(debugInfo),
  });
  console.log("🟢 Insert completed");

  return new Response(JSON.stringify(debugInfo), {
    status: 500,
    headers: {
      "Content-Type": "application/json",
    },
  }) as never;
}

declare global {
  // eslint-disable-next-line no-var
  var dd: (data: unknown) => Promise<never>;
}

global.dd = dd;

export {};
