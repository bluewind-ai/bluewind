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
          try {
            console.log("INSERT CALLED:", {
              table: table[Symbol.for("drizzle:Name")],
              tableKeys: Object.keys(table),
              tableMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(table)),
            });

            console.log("BEFORE CHAIN");
            const chain = insertFn(table);
            console.log("AFTER CHAIN:", chain);

            console.log("BEFORE PROXY");
            const proxy = new Proxy(chain, {
              get(chainTarget: any, chainProp: string | symbol) {
                console.log("PROXY ACCESS:", {
                  prop: String(chainProp),
                  targetType: typeof chainTarget,
                });

                const value = chainTarget[chainProp];

                if (chainProp === "returning") {
                  return async function (...args: any[]) {
                    const result = await value.apply(chainTarget, args);

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

                return typeof value === "function" ? value.bind(chainTarget) : value;
              },
            });

            console.log("AFTER PROXY");
            return proxy;
          } catch (error) {
            console.error("ERROR IN INSERT:", error);
            throw error;
          }
        };
      }

      return typeof original === "function" ? original.bind(target) : original;
    },
  };

  return new Proxy(baseDb, handler);
}

export const db = createProxy();
