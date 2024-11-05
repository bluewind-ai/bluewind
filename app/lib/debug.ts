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

  // If it's called during a loader/action, wrap it in a Response
  // If it's called elsewhere, stringify it
  const formattedData = JSON.stringify(debugInfo, null, 2);

  if (typeof Response !== "undefined") {
    throw new Response(formattedData, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  // Fallback for non-Remix contexts
  console.log(formattedData);
  throw new Error(formattedData);
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
