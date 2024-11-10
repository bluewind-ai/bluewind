// app/db/index.ts

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { PgTable } from "drizzle-orm/pg-core";
import * as schema from "./schema";

const connectionString = `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
const client = postgres(connectionString);
const baseDb = drizzle(client, { schema });

function createProxy() {
  let currentInsertTable: PgTable<any> | null = null;

  return new Proxy(baseDb, {
    get(target, prop) {
      console.log("ROOT GET:", prop);

      if (prop === "insert") {
        return (table: any) => {
          console.log("INSERT CALLED WITH:", table);
          currentInsertTable = table;
          return {
            values: async (data: any) => {
              console.log("VALUES CALLED WITH:", { table: currentInsertTable, data });

              if (!currentInsertTable) {
                throw new Error("No table specified for insert");
              }

              // Pass through the original operation
              const result = await target.insert(currentInsertTable).values(data).returning();

              // Only create objects on successful insert
              if (!result[0]?.id) return result;

              // Skip if inserting into objects table
              if (currentInsertTable === schema.objects) return result;

              const tableName = Object.entries(schema).find(
                ([_, table]) => table === currentInsertTable,
              )?.[0];

              if (!tableName) {
                throw new Error("Could not determine table name");
              }

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

              return result;
            },
          };
        };
      }

      return target[prop as keyof typeof target];
    },
  });
}

export const db = createProxy();
