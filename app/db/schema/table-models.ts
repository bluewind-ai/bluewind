// app/db/schema/table-models.ts
export const TableModel = {
  USERS: "users",
  SESSIONS: "sessions",
  SERVER_FUNCTIONS: "server-functions",
  FUNCTION_CALLS: "function-calls",
  REQUEST_ERRORS: "request-errors",
  DEBUG_LOGS: "debug-logs",
  OBJECTS: "objects",
  REQUESTS: "requests",
  MODELS: "models",
} as const;
export type TableConfig = {
  displayName: string;
  urlName: string;
  modelName: string;
};
export const TABLES: Record<string, TableConfig> = {
  users: {
    displayName: "Users",
    urlName: TableModel.USERS,
    modelName: "users",
  },
  sessions: {
    displayName: "Sessions",
    urlName: TableModel.SESSIONS,
    modelName: "sessions",
  },
  serverFunctions: {
    displayName: "Server Functions",
    urlName: TableModel.SERVER_FUNCTIONS,
    modelName: "server_functions",
  },
  objects: {
    displayName: "Objects",
    urlName: TableModel.OBJECTS,
    modelName: "objects",
  },
  requests: {
    displayName: "Requests",
    urlName: TableModel.REQUESTS,
    modelName: "requests",
  },
  models: {
    displayName: "Models",
    urlName: TableModel.MODELS,
    modelName: "models",
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
