// app/middleware/insert.ts

import type { Context } from "hono";
import { z } from "zod";

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
  server_functions: z.object({
    id: z.number(),
    name: z.string(),
    type: z.string(),
    functionCallId: z.number(),
    requestId: z.number(),
    metadata: z.record(z.any()),
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
  context: Context,
  args: unknown[],
) {
  console.log("🔍 Insert middleware called for table:", tableName);
  const query = value.apply(target, args);

  return new Proxy(query as object, {
    get(target: object, prop) {
      console.log("🔗 Chaining method:", String(prop));
      const chainValue = Reflect.get(target, prop);
      if (prop === "values") {
        return function (values: Record<string, unknown> | Record<string, unknown>[]) {
          console.log("📊 Values method called for table:", tableName);

          let enrichedValues;
          if (tableName === "server_functions") {
            const processServerFuncValues = (v: Record<string, unknown>) => {
              return {
                ...v,
                requestId: v.requestId || 1,
              };
            };

            enrichedValues = Array.isArray(values)
              ? values.map(processServerFuncValues)
              : processServerFuncValues(values);
          } else {
            enrichedValues = Array.isArray(values)
              ? values.map((v) => ({ ...v, requestId: 1 }))
              : { ...values, requestId: 1 };
          }

          console.log("📝 Final enriched values:", enrichedValues);

          // Validate each item if it's an array, or just the single object
          if (tableName in tableSchemas) {
            if (Array.isArray(enrichedValues)) {
              enrichedValues.forEach((item) => {
                console.log("🔍 Validating array item:", item);
                tableSchemas[tableName as keyof typeof tableSchemas].parse(item);
              });
            } else {
              console.log("🔍 Validating single item:", enrichedValues);
              tableSchemas[tableName as keyof typeof tableSchemas].parse(enrichedValues);
            }
          }

          const valuesQuery = chainValue.apply(target as object, [enrichedValues]);
          console.log("📋 Generated query:", valuesQuery);

          return new Proxy(valuesQuery as object, {
            get(target: object, prop) {
              console.log("🔄 Final chain method:", String(prop));
              const returningValue = Reflect.get(target, prop);
              if (prop === "returning") {
                return async function (...args: unknown[]) {
                  console.log("⚡ Executing query with args:", args);
                  const result = await returningValue.apply(target as object, args);
                  console.log("✅ Insert completed for table:", tableName);
                  (context as any).queries = (context as any).queries || [];
                  (context as any).queries.push({
                    type: "insert",
                    table: tableName,
                    query: enrichedValues,
                    result,
                  });
                  console.log("📚 Updated queries length:", (context as any).queries.length);
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
