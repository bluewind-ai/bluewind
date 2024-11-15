// app/db/schema/enums.ts

import { pgEnum } from "drizzle-orm/pg-core";

export enum ActionType {
  USER = "USER",
  SYSTEM = "SYSTEM",
}

export enum FunctionCallStatus {
  READY_FOR_APPROVAL = "READY_FOR_APPROVAL",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  RUNNING = "RUNNING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export enum ServerFunctionType {
  SYSTEM = "SYSTEM",
  USER = "USER",
}

export const TableModel = {
  USERS: "Users",
  SESSIONS: "Sessions",
  ACTIONS: "Actions",
  FUNCTION_CALLS: "Function Calls",
  REQUEST_ERRORS: "Request Errors",
  DEBUG_LOGS: "Debug Logs",
  OBJECTS: "Objects",
  REQUESTS: "Requests",
} as const;

// Create Drizzle enums with at least one value
export const functionCallStatusEnum = pgEnum("function_call_status", [
  FunctionCallStatus.READY_FOR_APPROVAL,
  FunctionCallStatus.APPROVED,
  FunctionCallStatus.REJECTED,
  FunctionCallStatus.RUNNING,
  FunctionCallStatus.IN_PROGRESS,
  FunctionCallStatus.COMPLETED,
  FunctionCallStatus.FAILED,
]);

export const serverFunctionTypeEnum = pgEnum("server_function_type", [
  ServerFunctionType.SYSTEM,
  ServerFunctionType.USER,
]);

export const modelEnum = pgEnum("model", [
  TableModel.USERS,
  TableModel.SESSIONS,
  TableModel.ACTIONS,
  TableModel.FUNCTION_CALLS,
  TableModel.REQUEST_ERRORS,
  TableModel.DEBUG_LOGS,
  TableModel.OBJECTS,
  TableModel.REQUESTS,
]);
