// app/db/schema/table-models.ts
export const TableModel = {
  USERS: "users",
  SESSIONS: "sessions",
  ACTIONS: "actions",
  FUNCTION_CALLS: "function-calls",
  REQUEST_ERRORS: "request-errors",
  DEBUG_LOGS: "debug-logs",
  OBJECTS: "objects",
  REQUESTS: "requests",
} as const;
export type TableConfig = {
  displayName: string;
  urlName: string;
};
export const TABLES: Record<string, TableConfig> = {
  users: {
    displayName: "Users",
    urlName: TableModel.USERS,
  },
  sessions: {
    displayName: "Sessions",
    urlName: TableModel.SESSIONS,
  },
  actions: {
    displayName: "Actions",
    urlName: TableModel.ACTIONS,
  },
  functionCalls: {
    displayName: "Function Calls",
    urlName: TableModel.FUNCTION_CALLS,
  },
  requestErrors: {
    displayName: "Request Errors",
    urlName: TableModel.REQUEST_ERRORS,
  },
  debugLogs: {
    displayName: "Debug Logs",
    urlName: TableModel.DEBUG_LOGS,
  },
  objects: {
    displayName: "Objects",
    urlName: TableModel.OBJECTS,
  },
  requests: {
    displayName: "Requests",
    urlName: TableModel.REQUESTS,
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
