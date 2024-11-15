// app/db/schema/enums.ts

import { pgEnum } from "drizzle-orm/pg-core";

import { TableModel } from "./table-models";

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
