// app/db/schema/index.ts

export * from "./types";
export * from "./enums";
export * from "./function-calls/schema";
export * from "./objects/schema";
export * from "./apps/schema";
export * from "./users/schema";
export * from "./sessions/schema";
export * from "./actions/schema";
export * from "./request-errors/schema";
export * from "./debug-logs/schema";

// Table metadata
type TableConfig = {
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
};

export function getTableMetadata() {
  return Object.entries(TABLES).map(([key, config]) => ({
    name: key,
    ...config,
  }));
}
