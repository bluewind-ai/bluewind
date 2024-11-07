// app/routes/actions+/$name.tsx

import { json, type ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import {
  Form,
  useActionData,
  useParams,
  useRouteError,
  isRouteErrorResponse,
  useLoaderData,
} from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { withActionMiddleware } from "~/lib/action-middleware.server";
import { db } from "~/db";

export async function loader({ params }: LoaderFunctionArgs) {
  const existingAction = await db.query.actions.findFirst({
    where: (fields, { eq }) => eq(fields.name, params.name as string),
  });

  console.log("Found action in DB:", existingAction);

  if (!existingAction) {
    throw new Response(`Action ${params.name} not found in database`, { status: 404 });
  }

  return json({ action: existingAction });
}

const runAction = async ({ request, params, context }: ActionFunctionArgs) => {
  const actionName = params.name;

  let selectedAction;
  switch (actionName) {
    case "load-csv-data":
      selectedAction = (await import("~/actions/load-csv-data.server")).loadCsvData;
      break;
    case "load-actions":
      selectedAction = (await import("~/actions/load-actions.server")).loadActions;
      break;
    case "go-next":
      selectedAction = (await import("~/actions/go-next.server")).goNext;
      break;
    case "master":
      selectedAction = (await import("~/actions/master.server")).master;
      break;
    default:
      throw new Response(`Action ${actionName} not found in actions map`, { status: 404 });
  }

  return selectedAction({ request, params, context: { ...context } });
};

export const action = withActionMiddleware(runAction);

export default function ActionRunner() {
  const { name } = useParams();
  useLoaderData<typeof loader>();
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

  const errorText = isRouteErrorResponse(error)
    ? error.data
    : error instanceof Error
      ? `${error.name}: ${error.message}\n\n${error.stack}`
      : "Unknown error";

  return (
    <div className="p-4">
      <textarea
        readOnly
        className="w-full h-[80vh] font-mono bg-slate-100 p-4"
        value={errorText}
        style={{
          resize: "none",
          whiteSpace: "pre",
          overflowWrap: "normal",
          overflow: "auto",
        }}
        onClick={(e) => {
          const target = e.currentTarget;
          requestAnimationFrame(() => {
            const end = target.selectionEnd;
            target.setSelectionRange(end, end);
          });
        }}
      />
    </div>
  );
}