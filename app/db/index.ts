// app/db/index.ts

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { PgTable } from "drizzle-orm/pg-core";
import * as schema from "./schema";

const connectionString = `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
const client = postgres(connectionString);
const baseDb = drizzle(client, { schema });

function createProxyForChain(
  chain: any,
  table: PgTable<any>,
  target: PostgresJsDatabase<typeof schema>,
) {
  return new Proxy(chain, {
    get(chainTarget: any, chainProp: string | symbol) {
      console.log("CHAIN ACCESS:", String(chainProp));
      const method = chainTarget[chainProp];

      if (chainProp === "returning") {
        return async function (...args: any[]) {
          const result = await method.apply(chainTarget, args);

          if (result?.[0]?.id && table !== schema.objects) {
            const tableName = table[Symbol.for("drizzle:Name")];
            await target
              .insert(schema.objects)
              .values({
                functionCallId: 1,
                model: tableName,
                recordId: result[0].id,
              })
              .returning();
          }

          return result;
        };
      }

      return typeof method === "function" ? method.bind(chainTarget) : method;
    },
  });
}

function createProxy() {
  const handler = {
    get(target: PostgresJsDatabase<typeof schema>, prop: string | symbol) {
      const original = target[prop as keyof typeof target];

      if (prop === "insert") {
        return (table: PgTable<any>) => {
          console.log("INSERT:", table[Symbol.for("drizzle:Name")]);

          const chain = target.insert(table);

          return new Proxy(chain, {
            get(chainTarget: any, chainProp: string | symbol) {
              console.log("CHAIN ACCESS:", String(chainProp));
              const value = chainTarget[chainProp];

              if (chainProp === "values") {
                return (...args: any[]) => {
                  const valueChain = value.apply(chainTarget, args);

                  return new Proxy(valueChain, {
                    get(valuesTarget: any, valuesProp: string | symbol) {
                      console.log("VALUES ACCESS:", String(valuesProp));
                      const method = valuesTarget[valuesProp];

                      if (valuesProp === "onConflictDoUpdate") {
                        return (...cArgs: any[]) => {
                          const conflictChain = method.apply(valuesTarget, cArgs);
                          return createProxyForChain(conflictChain, table, target);
                        };
                      }

                      if (valuesProp === "returning") {
                        return async function (...rArgs: any[]) {
                          const result = await method.apply(valuesTarget, rArgs);

                          if (result?.[0]?.id && table !== schema.objects) {
                            const tableName = table[Symbol.for("drizzle:Name")];
                            await target
                              .insert(schema.objects)
                              .values({
                                functionCallId: 1,
                                model: tableName,
                                recordId: result[0].id,
                              })
                              .returning();
                          }

                          return result;
                        };
                      }

                      return typeof method === "function" ? method.bind(valuesTarget) : method;
                    },
                  });
                };
              }

              return typeof value === "function" ? value.bind(chainTarget) : value;
            },
          });
        };
      }

      return typeof original === "function" ? original.bind(target) : original;
    },
  };

  return new Proxy(baseDb, handler);
}

export const db = createProxy();
