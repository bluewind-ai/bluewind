// app/db/schema.ts

import { functionCalls } from "./schema/function-calls/schema";
import { models } from "./schema/models/schema";
import { objects } from "./schema/objects/schema";
import { rawData } from "./schema/raw-data/schema";
import { requests } from "./schema/requests/schema";
import { serverFunctionsTableDefinition } from "./schema/server-functions/schema";
import { sessions } from "./schema/sessions/schema";
import { users } from "./schema/users/schema";

// Re-export everything for application use
export * from "./schema/function-calls/schema";
export * from "./schema/models/schema";
export * from "./schema/objects/schema";
export * from "./schema/raw-data/schema";
export * from "./schema/requests/schema";
export * from "./schema/server-functions/schema";
export * from "./schema/sessions/schema";
export * from "./schema/table-models";
export * from "./schema/users/schema";

// Export the schema with table definitions for Drizzle migrations
export const schema = {
  functionCalls,
  models,
  objects,
  rawData,
  requests,
  serverFunctions: serverFunctionsTableDefinition, // Use the table definition for migrations
  sessions,
  users,
};
