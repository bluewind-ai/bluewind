// app/middleware/insert.ts

import type { DrizzleQuery } from ".";

type FunctionWithApply = {
  (...args: unknown[]): unknown;
  apply(thisArg: any, argArray: unknown[]): unknown;
};

export function insertMiddleware(
  target: any,
  value: FunctionWithApply,
  tableName: string,
  queries: DrizzleQuery[],
  args: unknown[],
) {
  const query = value.apply(target, args);
  return new Proxy(query as object, {
    get(target: object, prop) {
      console.log("🔗 Chaining method:", String(prop));
      const chainValue = Reflect.get(target, prop);
      if (prop === "values") {
        return function (...args: unknown[]) {
          console.log("📊 Values method called for table:", tableName);
          const valuesQuery = chainValue.apply(target as object, args);
          return new Proxy(valuesQuery as object, {
            get(target: object, prop) {
              console.log("🔄 Final chain method:", String(prop));
              const returningValue = Reflect.get(target, prop);
              if (prop === "returning") {
                return async function (...args: unknown[]) {
                  const result = await returningValue.apply(target as object, args);
                  console.log("✅ Insert completed for table:", tableName);
                  queries.push({
                    type: "insert",
                    table: tableName,
                    query: args[0],
                    result,
                  });
                  console.log("📚 Updated queries length:", queries.length);
                  return result;
                };
              }
              return returningValue;
            },
          });
        };
      }
      return chainValue;
    },
  });
}
