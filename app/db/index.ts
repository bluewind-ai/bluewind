// app/db/index.ts

import { createDbClient } from "./db-client";

const connectionString = `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

export const db = createDbClient(connectionString);
