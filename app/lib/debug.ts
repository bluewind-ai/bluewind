// app/lib/debug.ts

type DebugInfo = {
  type: "Error";
  message: string;
  data: Record<string, unknown>;
};

export function dd(data: unknown): never {
  const debugInfo: DebugInfo = {
    type: "Error",
    message: "Debug Dump",
    data: {
      debug: data,
    },
  };

  throw new Response(JSON.stringify(debugInfo, null, 2), {
    status: 200, // Using 200 so it doesn't trigger error boundaries
    headers: {
      "Content-Type": "application/json",
    },
  });
}
