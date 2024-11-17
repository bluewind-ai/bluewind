// app/components/back-office-tree.tsx
import { type NavigationNode, NavigationTree } from "~/components/navigation-tree";

interface BackOfficeTreeProps {
  data: NavigationNode;
}
export function BackOfficeTree({ data }: BackOfficeTreeProps) {
  return (
    <div className="w-64 border-l">
      <NavigationTree data={data} />
    </div>
  );
}
