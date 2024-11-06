// app/lib/debug.ts

import { db } from "~/db";
import { debugLogs } from "~/db/schema";
import { emitter } from "~/services/emitter.server";

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
  const debugInfo = formatDebugInfo(data);

  const log = await db
    .insert(debugLogs)
    .values({
      message: JSON.stringify(debugInfo),
    })
    .returning();

  emitter.emit("debug", log[0]);

  throw new Response(JSON.stringify(debugInfo), {
    status: 500,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

declare global {
  // eslint-disable-next-line no-var
  var dd: (data: unknown) => Promise<never>;
}

global.dd = dd;

export {};
