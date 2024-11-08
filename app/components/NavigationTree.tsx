// app/components/NavigationTree.tsx

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link } from "@remix-run/react";

export type NavigationNode = {
  id: number;
  name: string;
  urlName?: string;
  iconKey?: string;
  type: "root" | "app" | "file";
  children: NavigationNode[];
};

type NavigationTreeProps = {
  data: NavigationNode;
};

export function NavigationTree({ data }: NavigationTreeProps) {
  const renderNode = (node: NavigationNode) => {
    const linkTo = node.type === "file" ? `/objects/${node.urlName}` : "";

    return (
      <div key={node.id}>
        <Link
          to={linkTo}
          className="flex items-center p-2 gap-2 hover:bg-gray-100 transition-colors"
        >
          <span>{node.name}</span>
        </Link>
        {node.children.map((child) => renderNode(child))}
      </div>
    );
  };

  return <div className="w-64 bg-white border-r">{renderNode(data)}</div>;
}
