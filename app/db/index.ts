// app/db/index.ts

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { PgTable } from "drizzle-orm/pg-core";
import * as schema from "./schema";

const connectionString = `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
const client = postgres(connectionString);
const baseDb = drizzle(client, { schema });

type ChainState = {
  tableName: string;
  hasReturning: boolean;
};

function wrapChain(chain: any, state: ChainState) {
  return new Proxy(chain, {
    get(target: any, prop: string | symbol) {
      console.log(`CHAIN ACCESS [${state.tableName}]:`, String(prop));
      const value = target[prop];

      // Handle returning() call
      if (prop === "returning") {
        state.hasReturning = true;
        return async function (...args: any[]) {
          const result = await value.apply(target, args);
          console.log("RETURNING:", { table: state.tableName, result });
          return result;
        };
      }

      // Handle promise execution
      if (prop === "then" || prop === "catch" || prop === "finally" || prop === "execute") {
        if (!state.hasReturning) {
          throw new Error(`Query on table ${state.tableName} must call returning()`);
        }
      }

      // Handle onConflictDoUpdate
      if (prop === "onConflictDoUpdate") {
        return (...args: any[]) => {
          console.log("UPDATE:", { table: state.tableName, args: args[0] });
          const conflictChain = value.apply(target, args);
          return wrapChain(conflictChain, state);
        };
      }

      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

function createProxy() {
  const handler = {
    get(target: PostgresJsDatabase<typeof schema>, prop: string | symbol) {
      const original = target[prop as keyof typeof target];
      console.log("DB ACCESS:", String(prop));

      if (prop === "insert") {
        return (table: PgTable<any>) => {
          const tableName = table[Symbol.for("drizzle:Name")];
          console.log("INSERT:", tableName);

          const state: ChainState = {
            tableName,
            hasReturning: false,
          };

          const chain = target.insert(table);

          return new Proxy(chain, {
            get(chainTarget: any, chainProp: string | symbol) {
              const value = chainTarget[chainProp];

              if (chainProp === "values") {
                return (...args: any[]) => {
                  console.log("VALUES:", { table: tableName, data: args[0] });
                  const valueChain = value.apply(chainTarget, args);
                  return wrapChain(valueChain, state);
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
