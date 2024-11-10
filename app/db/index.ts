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
  let currentTable: PgTable<any> | null = null;

  const handler = {
    get(target: PostgresJsDatabase<typeof schema>, prop: string | symbol) {
      const original = target[prop as keyof typeof target];

      if (prop === "insert") {
        const insertFn = original as typeof target.insert;
        return (table: PgTable<any>) => {
          console.log("INSERT:", table);
          currentTable = table;
          const chain = insertFn(table);

          return new Proxy(chain, {
            get(chainTarget: any, chainProp: string | symbol) {
              const chainMethod = chainTarget[chainProp];

              if (chainProp === "returning") {
                return async function (...args: any[]) {
                  console.log("RETURNING:", args);
                  const result = await chainMethod.apply(chainTarget, args);

                  if (result?.[0]?.id && currentTable && currentTable !== schema.objects) {
                    const tableName = currentTable[Symbol.for("drizzle:Name")];
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

              return typeof chainMethod === "function"
                ? chainMethod.bind(chainTarget)
                : chainMethod;
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
