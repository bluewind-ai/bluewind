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
  throw new Response(JSON.stringify(formatDebugInfo(data)), {
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
