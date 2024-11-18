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
  const [users, sessions, serverFunctions, functionCalls, objects, requests, models] =
    await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(schema.users),
      db.select({ count: sql<number>`count(*)` }).from(schema.sessions),
      db.select({ count: sql<number>`count(*)` }).from(schema.serverFunctions),
      db.select({ count: sql<number>`count(*)` }).from(schema.functionCalls),
      db.select({ count: sql<number>`count(*)` }).from(schema.objects),
      db.select({ count: sql<number>`count(*)` }).from(schema.requests),
      db.select({ count: sql<number>`count(*)` }).from(schema.models),
    ]);
  const counts = {
    [TableModel.USERS]: users[0].count,
    [TableModel.SESSIONS]: sessions[0].count,
    [TableModel.SERVER_FUNCTIONS]: serverFunctions[0].count,
    [TableModel.FUNCTION_CALLS]: functionCalls[0].count,
    [TableModel.OBJECTS]: objects[0].count,
    [TableModel.REQUESTS]: requests[0].count,
    [TableModel.MODELS]: models[0].count,
  };
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
