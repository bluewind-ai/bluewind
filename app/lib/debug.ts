// app/lib/debug.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

declare global {
  function dd(...args: any[]): Response;
}

export class DDError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DDError";
  }
}

function formatStackTrace(stack: string): string {
  const relevantLines = stack
    .split("\n")
    .filter((line) => line.includes("/app/"))
    .map((line) => line.trim());

  return relevantLines.join("\n");
}

export function dd(messageOrError: any): Response {
  const stack = new Error().stack || "";
  const message = messageOrError instanceof Error ? messageOrError.message : messageOrError;
  const debugData = typeof message === "string" ? message : JSON.stringify(message, null, 2);
  const formattedMessage = `Debug Data:\n${debugData}\n\nStack:\n${formatStackTrace(stack)}`;

  return new Response(formattedMessage, {
    status: 418, // Using a special status code
    headers: {
      "Content-Type": "text/plain",
      "X-Debug": "true",
    },
  });
}

// Properly set global for Node.js environment
if (typeof global !== "undefined") {
  (global as any).dd = dd;
}

export {};
