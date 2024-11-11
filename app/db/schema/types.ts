// app/db/schema/types.ts

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
