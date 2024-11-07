// app/routes/actions+/$name.tsx

import { json, type ActionFunctionArgs } from "@remix-run/node";
import {
  Form,
  useActionData,
  useParams,
  useRouteError,
  isRouteErrorResponse,
} from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { withActionMiddleware } from "~/lib/action-middleware.server";
import { goNext } from "~/actions/go-next.server";
import { loadCsvData } from "~/actions/load-csv-data.server";
import { master } from "~/actions/master.server";
import { loadActions } from "~/actions/load-actions.server";

const actions = {
  "load-csv-data": loadCsvData,
  "load-actions": loadActions,
  "go-next": goNext,
  master,
} as const;

const runAction = async ({ request, params }: ActionFunctionArgs) => {
  console.log("Running action with params:", params);
  console.log("Available actions:", Object.keys(actions));
  const actionName = params.name;
  console.log("Looking for action:", actionName);
  const action = actions[actionName as keyof typeof actions];

  if (!action) {
    return json({ error: `Action ${actionName} not found in actions map` });
  }

  return action(request);
};

export const action = withActionMiddleware(runAction);

export default function ActionRunner() {
  const { name } = useParams();
  const actionData = useActionData<typeof action>();
  const vscodeUrl = `vscode://file/Users/merwanehamadi/code/bluewind/app/actions/${name}.server.ts`;

  return (
    <div className="p-4">
      <div className="flex items-center gap-2">
        <Form method="post">
          <Button type="submit">
            {name!
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")}
          </Button>
        </Form>
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
      </div>
      {actionData && (
        <pre className="mt-4 p-4 bg-slate-100 rounded">{JSON.stringify(actionData, null, 2)}</pre>
      )}
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  return (
    <div className="p-4 text-red-500">
      <pre className="mt-4 rounded bg-slate-100 p-4">
        {isRouteErrorResponse(error)
          ? JSON.stringify(error.data, null, 2)
          : error instanceof Error
            ? error.message
            : "Unknown error"}
      </pre>
    </div>
  );
}
