// app/components/back-office-tree.tsx
import { type NavigationNode, NavigationTree } from "~/components/navigation-tree";
import { type apps } from "~/db/schema";

interface BackOfficeTreeProps {
  data: NavigationNode;
  apps: (typeof apps.$inferSelect)[];
}
export function BackOfficeTree({ data, apps }: BackOfficeTreeProps) {
  return (
    <div className="w-64 border-l">
      <NavigationTree data={data} apps={apps} />
    </div>
  );
}
