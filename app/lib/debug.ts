// app/lib/debug.ts

const DD_PREFIX = "DD_DEBUG_BREAK: ";

function dd(...args: any[]): never {
  const formattedArgs = JSON.stringify(args, null, 2);
  const stack = new Error().stack?.split("\n").slice(1).join("\n") || "";

  throw new Error(DD_PREFIX + formattedArgs + "\n\n" + stack);
}

(global as any).dd = dd;

export { dd };
