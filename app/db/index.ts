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

function createChainProxy(target: any, state: ChainState): any {
  return new Proxy(target, {
    get(obj: any, prop: string | symbol) {
      const value = obj[prop];

      // Intercept promise methods
      if (prop === "then" || prop === "catch" || prop === "finally") {
        if (!state.hasReturning) {
          throw new Error(
            `Query on table ${state.tableName} must call returning() before execution`,
          );
        }
        return value.bind(obj);
      }

      // Handle returning()
      if (prop === "returning") {
        state.hasReturning = true;
        return (...args: any[]) => {
          const result = value.apply(obj, args);
          console.log("RETURNING:", { table: state.tableName, result });
          return result;
        };
      }

      // Handle onConflictDoUpdate
      if (prop === "onConflictDoUpdate") {
        return (...args: any[]) => {
          console.log("UPDATE:", { table: state.tableName, args: args[0] });
          const result = value.apply(obj, args);
          return createChainProxy(result, state);
        };
      }

      // Handle other methods
      if (typeof value === "function") {
        return (...args: any[]) => {
          const result = value.apply(obj, args);
          if (result && (typeof result === "object" || typeof result === "function")) {
            return createChainProxy(result, state);
          }
          return result;
        };
      }

      return value;
    },

    // Crucial: also intercept direct promise usage without .then()
    apply(target: any, thisArg: any, args: any[]) {
      if (!state.hasReturning) {
        throw new Error(`Query on table ${state.tableName} must call returning() before execution`);
      }
      return Reflect.apply(target, thisArg, args);
    },
  });
}

function createProxy() {
  return new Proxy(baseDb, {
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

          return createChainProxy(chain, {
            tableName,
            hasReturning: false,
          });
        };
      }

      return typeof original === "function" ? original.bind(target) : original;
    },
  });
}

export const db = createProxy();
