// app/types/action-record.ts

export type ActionRecord = {
  id: number;
  name: string;
  displayName: string;
  lastCallStatus: string;
  lastRunAt: string | null;
  totalCalls: number;
};
