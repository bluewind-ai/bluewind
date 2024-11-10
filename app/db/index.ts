// app/db/index.ts

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { PgTable } from "drizzle-orm/pg-core";
import * as schema from "./schema";

const connectionString = `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
const client = postgres(connectionString);
const baseDb = drizzle(client, { schema });

function createProxy() {
  const handler = {
    get(target: PostgresJsDatabase<typeof schema>, prop: string | symbol) {
      const original = target[prop as keyof typeof target];
      console.log("DB ACCESS:", String(prop));

      if (prop === "insert") {
        return (table: PgTable<any>) => {
          const tableName = table[Symbol.for("drizzle:Name")];
          console.log("INSERT:", tableName);

          const chain = target.insert(table);

          return new Proxy(chain, {
            get(chainTarget: any, chainProp: string | symbol) {
              console.log("CHAIN ACCESS:", String(chainProp));
              const value = chainTarget[chainProp];

              if (chainProp === "values") {
                return (...args: any[]) => {
                  console.log("VALUES:", { table: tableName, data: args[0] });
                  const valueChain = value.apply(chainTarget, args);
                  let hasReturning = false;

                  return new Proxy(valueChain, {
                    get(valuesTarget: any, valuesProp: string | symbol) {
                      console.log("VALUES CHAIN ACCESS:", String(valuesProp));
                      const method = valuesTarget[valuesProp];

                      if (valuesProp === "onConflictDoUpdate") {
                        return (...cArgs: any[]) => {
                          console.log("UPDATE:", { table: tableName, args: cArgs[0] });
                          const conflictChain = method.apply(valuesTarget, cArgs);

                          return new Proxy(conflictChain, {
                            get(conflictTarget: any, conflictProp: string | symbol) {
                              console.log("CONFLICT CHAIN ACCESS:", String(conflictProp));
                              const conflictMethod = conflictTarget[conflictProp];

                              if (conflictProp === "execute") {
                                if (!hasReturning) {
                                  throw new Error(
                                    `Query on table ${tableName} must call returning()`,
                                  );
                                }
                              }

                              if (conflictProp === "returning") {
                                hasReturning = true;
                              }

                              return typeof conflictMethod === "function"
                                ? conflictMethod.bind(conflictTarget)
                                : conflictMethod;
                            },
                          });
                        };
                      }

                      if (valuesProp === "returning") {
                        hasReturning = true;
                        return async function (...args: any[]) {
                          const result = await method.apply(valuesTarget, args);
                          console.log("RETURNING:", { table: tableName, result });

                          if (result?.[0]?.id && table !== schema.objects) {
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

                      if (valuesProp === "execute") {
                        if (!hasReturning) {
                          throw new Error(`Query on table ${tableName} must call returning()`);
                        }
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
