// app/db/db-client.ts

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const insertOriginal = (insertTarget as any)[insertProp];

            if (insertProp === "values") {
              return async function (...args: unknown[]) {
                console.log("Proxy before insert:", { args });

                // Do the original insert
                const result = await insertOriginal.apply(insertTarget, args);
                console.log("Proxy after insert result:", result);

                // Get the table name and inserted id from the result
                const [table] = args;
                const [inserted] = result;
                console.log("Proxy extracted data:", { table, inserted });

                // Track in objects table
                console.log("Proxy attempting to insert object:", {
                  model: table,
                  recordId: inserted.id,
                  functionCallId: 1,
                });

                const objectResult = await db
                  .insert(schema.objects)
                  .values({
                    model: table as string,
                    recordId: inserted.id,
                    functionCallId: 1,
                  })
                  .returning();

                console.log("Proxy object insert result:", objectResult);

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
