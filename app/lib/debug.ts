// app/lib/debug.ts

type DebugInfo = {
  type: string;
  message: string;
  data: unknown;
};

export function dd(data: unknown): never {
  const debugInfo: DebugInfo = {
    type: "Debug",
    message: "Debug Dump",
    data,
  };

  throw new Response(JSON.stringify(debugInfo, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
