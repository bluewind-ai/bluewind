// app/functions/load-objects-table.server.ts

import { eq } from "drizzle-orm";

import { objects } from "~/db/schema";
import type { DbClient } from "~/middleware";

export type LoadObjectsTableArgs = {
  functionCallId?: string;
};

export async function loadObjectsTable(db: DbClient, args: LoadObjectsTableArgs) {
  return db.query.objects.findMany({
    orderBy: objects.id,
    where: args.functionCallId
      ? eq(objects.functionCallId, parseInt(args.functionCallId))
      : undefined,
  });
}
