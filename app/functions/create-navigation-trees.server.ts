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
    counts?: Record<string, number>;
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
        counts: options.counts,
      } as NavigationNode,
      backOfficeData: {
        id: 0,
        name: "Database",
        type: "root" as const,
        iconKey: "database",
        counts: options.counts,
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
  const tables = getTableMetadata();
  const backOfficeData: NavigationNode = {
    id: 0,
    name: "Database",
    type: "root" as const,
    iconKey: "database",
    counts: options.counts,
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
