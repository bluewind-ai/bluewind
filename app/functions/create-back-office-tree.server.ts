// app/functions/create-back-office-tree.server.ts
import type { NavigationNode } from "~/components/navigation-tree";
import { getTableMetadata } from "~/db/schema";

export function createBackOfficeTree(): NavigationNode {
  return {
    id: 0,
    name: "Database",
    type: "root",
    iconKey: "database",
    children: getTableMetadata().map((table, index) => ({
      id: index + 1,
      name: table.displayName,
      to: `/back-office/${table.urlName}`,
      type: "file" as const,
      children: [] as NavigationNode[],
    })),
  };
}
