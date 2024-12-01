// app/functions/load-navigation-data.server.ts

import { sql } from "drizzle-orm";

import { type NavigationNode } from "~/components/navigation-tree";
import * as schema from "~/db/schema";
import { TableModel } from "~/db/schema/table-models";
import { ExtendedContext } from "~/middleware";
import { db } from "~/middleware/main";

import { createNavigationTrees } from "./create-navigation-trees.server";

export async function loadNavigationData(request: ExtendedContext) {
  const [users, sessions, serverFunctions, objects, requests, models] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(schema.users),
    db.select({ count: sql<number>`count(*)` }).from(schema.sessions),
    db.select({ count: sql<number>`count(*)` }).from(schema.serverFunctions),
    db.select({ count: sql<number>`count(*)` }).from(schema.objects),
    db.select({ count: sql<number>`count(*)` }).from(schema.requests),
    db.select({ count: sql<number>`count(*)` }).from(schema.models),
  ]);

  const counts = {
    [TableModel.USERS]: users[0].count,
    [TableModel.SESSIONS]: sessions[0].count,
    [TableModel.SERVER_FUNCTIONS]: serverFunctions[0].count,
    [TableModel.OBJECTS]: objects[0].count,
    [TableModel.REQUESTS]: requests[0].count,
    [TableModel.MODELS]: models[0].count,
  };

  const { backOfficeData, apps } = await createNavigationTrees(db, {
    navigationName: "Objects",
    counts,
  });

  const requestsData = await db.query.requests.findMany({
    orderBy: [schema.requests.id],
  });

  const renderableRequests = requestsData.map((request) => ({
    id: request.id,
    requestId: request.requestId,
    pathname: request.pathname,
  }));

  const navigationData: NavigationNode = {
    id: 0,
    name: "Requests",
    type: "root",
    iconKey: "database",
    children: renderableRequests.map((request, index: number) => ({
      id: index + 1,
      name: `${request.pathname} (${request.id})`,
      to: `/requests/${request.id}`,
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
