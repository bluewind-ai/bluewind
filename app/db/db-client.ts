// app/db/db-client.ts

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

export const createDbClient = (connectionString: string) => {
  const client = postgres(connectionString);
  const db = drizzle(client, { schema });

  return new Proxy(db, {
    get(target: PostgresJsDatabase<typeof schema>, prop: string | symbol) {
      const original = target[prop as keyof typeof target];

      if (prop === "insert") {
        return new Proxy(original as object, {
          get(insertTarget: object, insertProp: string | symbol) {
            const insertOriginal = (insertTarget as any)[insertProp];

            if (insertProp === "values") {
              return async function (...args: unknown[]) {
                // Do the original insert
                const result = await insertOriginal.apply(insertTarget, args);

                // Get the table name and inserted id from the result
                const [table] = args;
                const [inserted] = result;

                // Track in objects table
                await db.insert(schema.objects).values({
                  model: table as string,
                  recordId: inserted.id,
                });

                return result;
              };
            }
            return insertOriginal;
          },
        });
      }
      return original;
    },
  });
};
