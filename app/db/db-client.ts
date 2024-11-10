// app/db/db-client.ts

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export const createDbClient = (connectionString: string) => {
  const client = postgres(connectionString);
  const db = drizzle(client, { schema });

  // Create proxy to intercept inserts
  return new Proxy(db, {
    get(target, prop) {
      const original = target[prop];

      if (prop === "insert") {
        return new Proxy(original, {
          get(insertTarget, insertProp) {
            const insertOriginal = insertTarget[insertProp];

            if (insertProp === "values") {
              return async function (...args) {
                // Do the original insert
                const result = await insertOriginal.apply(insertTarget, args);

                // Get the table name and inserted id from the result
                const [table] = args;
                const [inserted] = result;

                // Track in objects table
                await db.insert(schema.objects).values({
                  model: table,
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
