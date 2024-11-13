// app/db/schema.ts
export * from "./schema/apps/schema";
export * from "./schema/debug-logs/schema";
export * from "./schema/enums";
export * from "./schema/function-calls/schema";
export * from "./schema/objects/schema";
export * from "./schema/request-errors/schema";
export * from "./schema/requests/schema"; // Add this line
export * from "./schema/server-functions/schema";
export * from "./schema/sessions/schema";
export * from "./schema/types";
export * from "./schema/users/schema";
// Table metadata
export type TableConfig = {
  displayName: string;
  urlName: string;
};
export const TABLES: Record<string, TableConfig> = {
  users: {
    displayName: "Users",
    urlName: "users",
  },
  sessions: {
    displayName: "Sessions",
    urlName: "sessions",
  },
  actions: {
    displayName: "Actions",
    urlName: "actions",
  },
  functionCalls: {
    displayName: "Function Calls",
    urlName: "function-calls",
  },
  requestErrors: {
    displayName: "Request Errors",
    urlName: "request-errors",
  },
  debugLogs: {
    displayName: "Debug Logs",
    urlName: "debug-logs",
  },
  objects: {
    displayName: "Objects",
    urlName: "objects",
  },
  requests: {
    // Add this entry
    displayName: "Requests",
    urlName: "requests",
  },
};
export interface TableMetadata extends TableConfig {
  name: string;
}
export function getTableMetadata(): TableMetadata[] {
  return Object.entries(TABLES).map(([key, config]) => ({
    name: key,
    ...config,
  }));
}
