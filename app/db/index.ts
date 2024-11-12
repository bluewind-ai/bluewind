// app/db/index.ts

import postgres from "postgres";

import { createDbClient } from "./db-client";
import { createRlsDbClient } from "./proxy";
import type { Owner } from "./proxy.types";

const connectionString = `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const client = postgres(connectionString);

// Export both regular and RLS-enabled client creators
export const db = createDbClient(connectionString); // Use the proxied client
export const getRlsDb = (owner: Owner) => createRlsDbClient(client, owner);

export type AnyArgs = any[];
