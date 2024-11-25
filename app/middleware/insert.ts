// app/middleware/insert.ts
import { z } from "zod";

import { ExtendedContext } from ".";

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
  c: ExtendedContext,
  args: unknown[],
) {
  if (!c.requestId) {
    throw new Error("Request ID is required");
  }
  const query = value.apply(target, args);
  return new Proxy(query as object, {
    get(target: object, prop) {
      const chainValue = Reflect.get(target, prop);
      if (prop === "values") {
        return function (values: Record<string, unknown> | Record<string, unknown>[]) {
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
              const returningValue = Reflect.get(target, prop);
              if (prop === "returning") {
                return async function (...args: unknown[]) {
                  const result = await returningValue.apply(target as object, args);
                  (c as any).queries = (c as any).queries || [];
                  (c as any).queries.push({
                    type: "insert",
                    table: tableName,
                    query: enrichedValues,
                    result,
                  });
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
