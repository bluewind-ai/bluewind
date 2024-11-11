// app/db/schema/types.ts

export enum ActionType {
  SYSTEM = "system",
  USER = "user",
  WORKFLOW = "workflow",
}

export enum FunctionCallStatus {
  READY_FOR_APPROVAL = "ready_for_approval",
  RUNNING = "running",
  COMPLETED = "completed",
}
