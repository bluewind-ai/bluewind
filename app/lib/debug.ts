// app/lib/debug.ts

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
  const formattedData = JSON.stringify(debugInfo, null, 2);

  // Always throw in Remix server context
  throw new Response(formattedData, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

// Make dd truly global for Node.js
declare global {
  // @ts-expect-error - Intentionally adding dd to global scope
  let dd: typeof dd;
}

if (typeof global !== "undefined") {
  // @ts-expect-error - Intentionally adding dd to global scope
  (global as { dd: typeof dd }).dd = dd;
}

export {};
