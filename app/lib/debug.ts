// app/lib/debug.ts

function dd(...args: any[]): never {
  console.log(...args);
  console.log(new Error().stack);
  process.exit(1);
}

(global as any).dd = dd;

export { dd };
