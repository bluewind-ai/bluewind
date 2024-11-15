// app/functions/create-navigation-trees.server.ts

import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import { type NavigationNode } from "~/components/navigation-tree";
import { apps, serverFunctions } from "~/db/schema";
import * as schema from "~/db/schema";
import { getTableMetadata } from "~/db/schema/table-models";

export async function createNavigationTrees(
  db: PostgresJsDatabase<typeof schema>,
  options: {
    navigationName: string;
    navigationIconKey?: string;
  },
) {
  const masterAction = await db.query.serverFunctions.findFirst({
    where: eq(serverFunctions.name, "master"),
  });

  if (!masterAction) {
    return {
      navigationData: {
        id: 0,
        name: options.navigationName,
        type: "root" as const,
        iconKey: options.navigationIconKey || "database",
        children: [],
      } as NavigationNode,
      backOfficeData: {
        id: 0,
        name: "Database",
        type: "root" as const,
        iconKey: "database",
        children: getTableMetadata().map((table, index) => ({
          id: index + 1,
          name: table.displayName,
          to: `/${table.urlName}`,
          type: "file" as const,
          children: [] as NavigationNode[],
        })),
      } as NavigationNode,
      apps: [],
    };
  }

  const appsData = await db.select().from(apps).orderBy(apps.order);

  console.log("Getting table metadata for BackOfficeTree");
  const tables = getTableMetadata();
  console.log("Table metadata:", tables);

  const backOfficeData: NavigationNode = {
    id: 0,
    name: "Database",
    type: "root" as const,
    iconKey: "database",
    children: tables.map((table, index) => ({
      id: index + 1,
      name: table.displayName,
      to: `/${table.urlName}`,
      type: "file" as const,
      children: [] as NavigationNode[],
    })),
  };

  return {
    backOfficeData,
    apps: appsData,
  };
}