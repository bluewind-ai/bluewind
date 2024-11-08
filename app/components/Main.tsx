// app/components/Main.tsx

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Form, useNavigation } from "@remix-run/react";
import { Button } from "~/components/ui/button";

interface MainProps {
  data: any; // This could be either an Action or ActionCall tree
  buttonLabel: string;
  vscodeUrl?: string;
}

function TreeNode({
  node,
  currentId,
  depth = 0,
}: {
  node: any;
  currentId?: number;
  depth?: number;
}) {
  const isCurrentNode = node.id === currentId;

  return (
    <div style={{ marginLeft: `${depth * 20}px` }}>
      <div className={`p-2 ${isCurrentNode ? "bg-blue-100" : ""} rounded`}>
        <div className="font-semibold">
          {node.action?.name}({node.status})
        </div>
      </div>
      {node.children?.map((child: any) => (
        <TreeNode key={child.id} node={child} currentId={currentId} depth={depth + 1} />
      ))}
    </div>
  );
}

export function Main({ data, buttonLabel, vscodeUrl }: MainProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  console.log("[Main] Rendering with data:", data);
  console.log("[Main] Navigation state:", navigation.state);

  const isTree = data.tree && data.currentId;

  return (
    <div className="p-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Form method="post">
            <Button type="submit" disabled={isSubmitting}>
              {buttonLabel}
            </Button>
          </Form>
          {vscodeUrl && (
            <a href={vscodeUrl} className="text-gray-600 hover:text-gray-900">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                <polyline points="13 2 13 9 20 9"></polyline>
              </svg>
            </a>
          )}
        </div>

        <div className="bg-slate-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Workflows</h2>
          {isTree ? (
            <TreeNode node={data.tree} currentId={data.currentId} />
          ) : (
            <pre>{JSON.stringify(data, null, 2)}</pre>
          )}
        </div>
      </div>
    </div>
  );
}
