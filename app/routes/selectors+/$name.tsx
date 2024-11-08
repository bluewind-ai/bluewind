// app/routes/selectors+/$name.tsx

import { json, type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useParams, useRouteError, isRouteErrorResponse, useLoaderData } from "@remix-run/react";
import { executeAction } from "~/lib/execute-action.server";
import { db } from "~/db";
import { Main } from "~/components/Main";
import { eq, and } from "drizzle-orm";

export async function loader({ params }: LoaderFunctionArgs) {
  const existingSelector = await db.query.actions.findFirst({
    where: (fields) => and(eq(fields.name, params.name as string), eq(fields.type, "selector")),
  });

  if (!existingSelector) {
    throw new Response(`Selector ${params.name} not found in database`, { status: 404 });
  }

  return json({ selector: existingSelector });
}

export async function action(args: LoaderFunctionArgs) {
  const result = await executeAction(args);
  return redirect(`/action-calls/${result.id}`);
}

export default function SelectorRunner() {
  const { name } = useParams();
  const { selector: selectorDetails } = useLoaderData<typeof loader>();
  const vscodeUrl = `vscode://file/Users/merwanehamadi/code/bluewind/app/selectors/${name}.server.ts`;

  return <Main data={selectorDetails} buttonLabel="Run" vscodeUrl={vscodeUrl} />;
}

export function ErrorBoundary() {
  const error = useRouteError();
  const { name } = useParams();
  const routePath = `file:///Users/merwanehamadi/code/bluewind/app/routes/selectors+/${name}.tsx`;

  const errorText = `Caught in ${routePath}:\n\n${
    isRouteErrorResponse(error)
      ? error.data
      : error instanceof Error
        ? `${error.name}: ${error.message}\n\n${error.stack}`
        : "Unknown error"
  }`;

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