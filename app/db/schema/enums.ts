// app/db/schema/enums.ts

import { pgEnum } from "drizzle-orm/pg-core";

import { ActionType, FunctionCallStatus } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function enumToPgEnum<T extends Record<string, any>>(
  myEnum: T,
): [T[keyof T], ...T[keyof T][]] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Object.values(myEnum).map((value: any) => `${value}`) as any;
}

export const actionTypeEnum = pgEnum("action_type", enumToPgEnum(ActionType));
export const functionCallStatusEnum = pgEnum(
  "function_call_status",
  enumToPgEnum(FunctionCallStatus),
);
