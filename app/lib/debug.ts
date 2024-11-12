// app/lib/debug.ts

function dd(...args: any[]): never {
  const errorMessage = JSON.stringify(args, null, 2);
  throw new Error(errorMessage);
}

(global as any).dd = dd;

export { dd };
