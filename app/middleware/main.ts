// app/middleware/main.ts

import { sql } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import type { Context } from "hono";
import postgres from "postgres";

import { models, objects, requests } from "~/db/schema";
import * as schema from "~/db/schema";
import { TABLES } from "~/db/schema/table-models";
import { countTables } from "~/functions/count-tables.server";

import { createDbProxy, DrizzleQuery } from ".";
import { countObjectsForQueries } from "./functions";

const connectionString = `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
const baseDb = drizzle(postgres(connectionString), { schema });
export const db = baseDb;

type DbType = typeof db;
type TrxType = PgTransaction<any, typeof schema, any>;

export type ExtendedContext = Context & {
  db: DbType | TrxType;
  queries: DrizzleQuery[];
  requestId: number;
};

export async function mainMiddleware(c: Context, next: () => Promise<void>) {
  const url = new URL(c.req.url);
  const stack = new Error().stack
    ?.split("\n")
    .filter((line) => line.includes("/app/"))
    .map((line) => `    at ${line.substring(line.indexOf("/app/"))}`)
    .reverse()
    .join("\n");

  console.log(`${c.req.method} ${url.pathname} from:\n${stack}\n\n\n\n`);

  const allModels = await db.select({ id: models.id, pluralName: models.pluralName }).from(models);

  if (allModels.length === 0) {
    throw new Error("Models table is empty. Please run seed-models script first.");
  }

  const requestModel = allModels.find((model) => model.pluralName === TABLES.requests.modelName);

  if (!requestModel) {
    throw new Error("Request model not found. Please check models table data.");
  }

  const queries: DrizzleQuery[] = [];
  const dbWithProxy = createDbProxy(db, queries);

  const [{ request_id }] = await dbWithProxy.execute<{
    request_id: number;
  }>(sql`
    WITH request_insert AS (
      INSERT INTO ${requests} DEFAULT VALUES
      RETURNING id
    ),
    object_insert AS (
      INSERT INTO ${objects} (model_id, record_id, request_id)
      SELECT ${requestModel.id}, id, id FROM request_insert
      RETURNING *
    )
    SELECT request_insert.id as request_id
    FROM request_insert, object_insert;
  `);

  await dbWithProxy.transaction(
    async (trx) => {
      const proxiedTrx = createDbProxy(trx, queries);
      (c as ExtendedContext).db = proxiedTrx;
      (c as ExtendedContext).queries = queries;
      (c as ExtendedContext).requestId = request_id;

      await next();

      const objectsToInsert = await countObjectsForQueries(proxiedTrx, queries, request_id);
      if (objectsToInsert.length > 0) {
        await proxiedTrx.insert(objects).values(objectsToInsert);
      }

      // Let this error propagate up
      await countTables(proxiedTrx);
    },
    {
      isolationLevel: "serializable",
    },
  );
}
