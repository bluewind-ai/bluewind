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
      console.log("ROOT ACCESS:", { prop, type: typeof original });

      if (prop === "insert") {
        const insertFn = original as typeof target.insert;
        return (table: PgTable<any>) => {
          console.log("INSERT CALLED:", {
            table: table[Symbol.for("drizzle:Name")],
          });

          currentTable = table;
          const chain = insertFn(table);

          console.log("CHAIN METHODS:", chain);

          const proxy = new Proxy(chain, {
            get(chainTarget: any, chainProp: string | symbol) {
              console.log("CHAIN ACCESS:", {
                prop: String(chainProp),
                target: chainTarget,
              });

              const value = chainTarget[chainProp];
              return typeof value === "function" ? value.bind(chainTarget) : value;
            },
          });

          // Log the available methods on the proxy
          console.log("PROXY METHODS:", {
            values: typeof proxy.values,
            returning: typeof proxy.returning,
            onConflictDoUpdate: typeof proxy.onConflictDoUpdate,
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
