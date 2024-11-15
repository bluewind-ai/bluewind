// app/lib/debug.ts

function stringifyWithCircularRefs(
  obj: any,
  space: number | string = 2,
  currentDepth: number = 0,
): string {
  const MAX_DEPTH = 4;
  const MAX_KEYS = 10;
  const seen = new WeakSet();

  return JSON.stringify(
    obj,
    (key, value) => {
      if (typeof value === "function") {
        return `[Function: ${value.name || "anonymous"}]`;
      }

      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return `[Circular: ${value.constructor?.name || "Object"}]`;
        }
        seen.add(value);

        if (currentDepth >= MAX_DEPTH) {
          return `[Depth ${currentDepth}]`;
        }

        if (Array.isArray(value)) {
          if (value.length > MAX_KEYS) {
            return [
              ...value
                .slice(0, MAX_KEYS)
                .map((item) =>
                  typeof item === "object" && item !== null
                    ? JSON.parse(stringifyWithCircularRefs(item, space, currentDepth + 1))
                    : item,
                ),
              `[${value.length - MAX_KEYS} more...]`,
            ];
          }
          return value.map((item) =>
            typeof item === "object" && item !== null
              ? JSON.parse(stringifyWithCircularRefs(item, space, currentDepth + 1))
              : item,
          );
        }

        if (Object.keys(value).length > MAX_KEYS) {
          const limited: Record<string, unknown> = {};
          Object.keys(value)
            .slice(0, MAX_KEYS)
            .forEach((k) => {
              limited[k] =
                typeof value[k] === "object" && value[k] !== null
                  ? JSON.parse(stringifyWithCircularRefs(value[k], space, currentDepth + 1))
                  : value[k];
            });
          return { ...limited, _truncated: `[${Object.keys(value).length - MAX_KEYS} more...]` };
        }

        const processed: Record<string, unknown> = {};
        Object.keys(value).forEach((k) => {
          processed[k] =
            typeof value[k] === "object" && value[k] !== null
              ? JSON.parse(stringifyWithCircularRefs(value[k], space, currentDepth + 1))
              : value[k];
        });
        return processed;
      }

      return value;
    },
    space,
  );
}

function dd(...args: any[]): never {
  const formattedArgs = args.map((arg) => stringifyWithCircularRefs(arg));

  console.log("\n=== Debug Dump ===\n");
  formattedArgs.forEach((arg, i) => {
    console.log(`Arg ${i}:\n${arg}\n`);
  });

  throw new Error(formattedArgs.join("\n"));
}

(global as any).dd = dd;
export { dd };
