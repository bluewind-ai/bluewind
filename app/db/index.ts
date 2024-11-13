// app/db/index.ts
import { createDbClient } from "./db-client";

const connectionString = `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
// Go back to using the proxied client
export const db = createDbClient(connectionString);
export type AnyArgs = any[];
