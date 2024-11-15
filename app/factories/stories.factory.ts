// app/factories/stories.factory.ts
import type { ActionRecord } from "~/types/action-record";

export const STORIES = {
  actionRecords: {
    basic: [
      {
        id: 1,
        name: "syncUsers",
        displayName: "Sync Users",
        lastCallStatus: "completed",
        lastRunAt: "2024-11-14T15:30:00Z",
        totalCalls: 150,
      },
      {
        id: 2,
        name: "generateReport",
        displayName: "Generate Report",
        lastCallStatus: "running",
        lastRunAt: "2024-11-14T16:45:00Z",
        totalCalls: 75,
      },
      {
        id: 3,
        name: "cleanupFiles",
        displayName: "Cleanup Files",
        lastCallStatus: "ready_for_approval",
        lastRunAt: "2024-11-14T14:20:00Z",
        totalCalls: 42,
      },
      {
        id: 4,
        name: "indexData",
        displayName: "Index Data",
        lastCallStatus: "failed",
        lastRunAt: "2024-11-14T13:15:00Z",
        totalCalls: 98,
      },
      {
        id: 5,
        name: "archiveOldRecords",
        displayName: "Archive Old Records",
        lastCallStatus: "never_run",
        lastRunAt: null,
        totalCalls: 0,
      },
    ] satisfies ActionRecord[],
  },
};
