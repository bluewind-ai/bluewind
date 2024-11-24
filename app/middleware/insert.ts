// app/middleware/insert.ts

import { z } from "zod";

import type { DrizzleQuery } from ".";

const tableSchemas = {
  function_calls: z.object({
    serverFunctionId: z.number(),
    functionCallId: z.number(),
    status: z.string(),
    args: z.any().nullable(),
    result: z.any().nullable(),
    requestId: z.number(),
  }),
  models: z.object({
    id: z.number(),
    pluralName: z.string(),
    singularName: z.string(),
    requestId: z.number(),
    functionCallId: z.number(),
  }),
  // Add other schemas...
} as const;

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
        return function (values: Record<string, unknown> | Record<string, unknown>[]) {
          console.log("📊 Values method called for table:", tableName);

          // Handle both single objects and arrays
          const enrichedValues = Array.isArray(values)
            ? values.map((v) => ({ ...v, requestId: 1 }))
            : { ...values, requestId: 1 };

          console.log("📝 Enriched values:", enrichedValues);

          // Validate each item if it's an array, or just the single object
          if (tableName in tableSchemas) {
            if (Array.isArray(enrichedValues)) {
              enrichedValues.forEach((item) => {
                tableSchemas[tableName as keyof typeof tableSchemas].parse(item);
              });
            } else {
              tableSchemas[tableName as keyof typeof tableSchemas].parse(enrichedValues);
            }
          }

          const valuesQuery = chainValue.apply(target as object, [enrichedValues]);
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
                    query: enrichedValues,
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
