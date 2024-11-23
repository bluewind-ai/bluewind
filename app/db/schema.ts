// app/db/schema.ts
import * as tables from "./schema/index";

export * from "./schema/enums";
export * from "./schema/function-calls/schema";
export * from "./schema/models/schema";
export * from "./schema/objects/schema";
export * from "./schema/raw-data/schema";
export * from "./schema/requests/schema";
export * from "./schema/server-functions/schema";
export * from "./schema/sessions/schema";
export * from "./schema/table-models";
export * from "./schema/users/schema";
// Add the schema export for drizzle
export const schema = { schema: tables };
