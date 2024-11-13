// app/db/index.ts

import { createDbClient } from "./db-client";

const connectionString = `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

// Export both regular and RLS-enabled client creators
export const db = createDbClient(connectionString); // Use the proxied client

export type AnyArgs = any[];
