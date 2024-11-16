// app/functions/load-navigation-data.server.ts
import { type LoaderFunctionArgs } from "@remix-run/node";
import { sql } from "drizzle-orm";
import { type PostgresJsDatabase } from "drizzle-orm/postgres-js";

import { type NavigationNode } from "~/components/navigation-tree";
import * as schema from "~/db/schema";
import { TableModel } from "~/db/schema/table-models";

import { createNavigationTrees } from "./create-navigation-trees.server";

type DbClient = PostgresJsDatabase<typeof schema>;
export async function loadNavigationData(args: LoaderFunctionArgs) {
  const { db } = args.context as {
    db: DbClient;
  };
  const tableCounts = await db
    .select({
      modelId: schema.objects.modelId,
      pluralName: schema.models.pluralName,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(schema.objects)
    .leftJoin(schema.models, sql`${schema.objects.modelId} = ${schema.models.id}`)
    .groupBy(schema.objects.modelId, schema.models.pluralName);

  const counts = Object.fromEntries(
    Object.entries(schema.TABLES).map(([_key, config]) => {
      const count =
        config.urlName === TableModel.OBJECTS
          ? tableCounts.reduce((acc, curr) => acc + Number(curr.count), 0)
          : (tableCounts.find((t) => t.pluralName === config.modelName)?.count ?? 0);
      return [config.urlName, count];
    }),
  );
  const { backOfficeData, apps } = await createNavigationTrees(db, {
    navigationName: "Objects",
    counts,
  });
  const functionCallsData = await db.query.functionCalls.findMany({
    with: {
      serverFunction: true,
    },
    orderBy: schema.functionCalls.createdAt,
  });
  const renderableFunctionCalls = functionCallsData.map((call) => ({
    id: call.id,
    serverFunctionId: call.serverFunctionId,
    requestId: call.requestId,
    parentId: call.parentId,
    status: call.status,
    createdAt: call.createdAt.toISOString(),
    args: call.args ? JSON.stringify(call.args) : null,
    result: call.result ? JSON.stringify(call.result) : null,
    serverFunctionName: call.serverFunction?.name || "Unknown",
  }));
  const navigationData: NavigationNode = {
    id: 0,
    name: "Function Calls",
    type: "root",
    iconKey: "database",
    children: renderableFunctionCalls.map((functionCall, index: number) => ({
      id: index + 1,
      name: `Call ${functionCall.id}`,
      to: `/function-calls/${functionCall.id}`,
      type: "file",
      children: [],
    })),
    counts,
  };
  return {
    navigationData,
    apps,
    backOfficeData,
  };
}
