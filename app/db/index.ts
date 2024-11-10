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
      console.log("ROOT ACCESS:", { prop, type: typeof original });

      if (prop === "insert") {
        const insertFn = original as typeof target.insert;
        return (table: PgTable<any>) => {
          console.log("INSERT CALLED:", {
            table: table[Symbol.for("drizzle:Name")],
            tableKeys: Object.keys(table),
            tableMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(table)),
          });

          const chain = insertFn(table);
          console.log("CHAIN CREATED:", {
            chainType: typeof chain,
            chainKeys: Object.keys(chain),
            chainMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(chain)),
          });

          const proxy = new Proxy(chain, {
            get(chainTarget: any, chainProp: string | symbol) {
              console.log("PROXY ACCESS:", {
                prop: String(chainProp),
                targetType: typeof chainTarget,
                valueExists: chainProp in chainTarget,
                value: typeof chainTarget[chainProp],
              });

              const value = chainTarget[chainProp];

              if (chainProp === "returning") {
                return async function (...args: any[]) {
                  console.log("RETURNING CALLED with:", args);
                  const result = await value.apply(chainTarget, args);
                  console.log("RETURNING RESULT:", result);

                  if (result?.[0]?.id && table !== schema.objects) {
                    const tableName = table[Symbol.for("drizzle:Name")];
                    console.log("CREATING OBJECT:", {
                      model: tableName,
                      recordId: result[0].id,
                    });

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

              return typeof value === "function" ? value.bind(chainTarget) : value;
            },
          });

          return proxy;
        };
      }

      return typeof original === "function" ? original.bind(target) : original;
    },
  };

  return new Proxy(baseDb, handler);
}

export const db = createProxy();
