// app/functions/load-navigation-data.server.ts

import { sql } from "drizzle-orm";

import { type NavigationNode } from "~/components/navigation-tree";
import * as schema from "~/db/schema";
import { TableModel } from "~/db/schema/table-models";
import { ExtendedContext } from "~/middleware";

import { createNavigationTrees } from "./create-navigation-trees.server";

export async function loadNavigationData(request: ExtendedContext) {
  if (!request.db) {
    throw new Error("Database connection not available on request object");
  }

  const [users, sessions, serverFunctions, functionCalls, objects, requests, models] =
    await Promise.all([
      request.db.select({ count: sql<number>`count(*)` }).from(schema.users),
      request.db.select({ count: sql<number>`count(*)` }).from(schema.sessions),
      request.db.select({ count: sql<number>`count(*)` }).from(schema.serverFunctions),
      request.db.select({ count: sql<number>`count(*)` }).from(schema.functionCalls),
      request.db.select({ count: sql<number>`count(*)` }).from(schema.objects),
      request.db.select({ count: sql<number>`count(*)` }).from(schema.requests),
      request.db.select({ count: sql<number>`count(*)` }).from(schema.models),
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
  const { backOfficeData, apps } = await createNavigationTrees(request.db, {
    navigationName: "Objects",
    counts,
  });
  const functionCallsData = await request.db.query.functionCalls.findMany({
    with: {
      serverFunction: true,
    },
    orderBy: schema.functionCalls.createdAt,
  });
  const renderableFunctionCalls = functionCallsData.map((call) => ({
    id: call.id,
    serverFunctionId: call.serverFunctionId,
    requestId: call.requestId,
    functionCallId: call.functionCallId,
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
      name: `${functionCall.serverFunctionName} (${functionCall.id})`,
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
