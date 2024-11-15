// app/functions/load-objects-table.server.ts
import { eq } from "drizzle-orm";

import { objects } from "~/db/schema";
import type { DbClient } from "~/middleware";
import type { ActionRecord } from "~/types/action-record";

export type LoadObjectsTableArgs = {
  functionCallId?: string;
};
export async function loadObjectsTable(
  db: DbClient,
  args: LoadObjectsTableArgs,
): Promise<ActionRecord[]> {
  const allObjects = await db.query.objects.findMany({
    orderBy: objects.id,
    where: args.functionCallId
      ? eq(objects.functionCallId, parseInt(args.functionCallId))
      : undefined,
  });
  return allObjects.map((obj) => ({
    id: obj.id,
    name: obj.model,
    displayName: `${obj.model} #${obj.recordId}`,
    lastCallStatus: obj.functionCallId ? "completed" : "never_run",
    lastRunAt: null,
    totalCalls: 0,
  }));
}
