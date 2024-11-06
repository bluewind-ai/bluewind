// app/routes/action-calls.$id/route.tsx

import { useLoaderData, useRouteError, useFetcher } from "@remix-run/react";
import { json, type LoaderFunction, type ActionFunction } from "@remix-run/node";
import { db } from "~/db";
import { actionCalls } from "~/db/schema";
import { eq } from "drizzle-orm";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { master } from "~/actions/master.server";

// GoNext function (previously in go-next.server.ts)
const actionMap = { master } as const;

async function goNext(args: ActionFunctionArgs) {
  const currentActionCall = await db.query.actionCalls.findFirst({
    where: eq(actionCalls.id, parseInt(args.params.id || "")),
    with: { action: true },
  });

  if (!currentActionCall) {
    throw new Response("Action call not found", { status: 404 });
  }

  if (currentActionCall.status === "ready_for_approval") {
    const action = actionMap[currentActionCall.action.name as keyof typeof actionMap];
    await action(args);
    await db
      .update(actionCalls)
      .set({ status: "completed" })
      .where(eq(actionCalls.id, currentActionCall.id));
    return json({ actionCall: currentActionCall });
  }

  throw new Response(`Action ${currentActionCall.id} is not ready for approval`, { status: 400 });
}

// GoNext Button Component
function GoNextButton({
  actionCall,
  className,
  ...props
}: {
  actionCall: any;
  className?: string;
  [key: string]: any;
}) {
  const fetcher = useFetcher();
  return (
    <div className="flex flex-col gap-4">
      <fetcher.Form method="post" action={`/action-calls/${actionCall.id}`}>
        <Button
          type="submit"
          className={cn("bg-primary text-primary-foreground hover:bg-primary/90", className)}
          {...props}
        >
          {actionCall.status === "completed" ? "Next" : "Approve"}
        </Button>
      </fetcher.Form>
      {fetcher.data && (
        <main className="flex-1 bg-black text-green-400 p-4 font-mono">
          <pre className="whitespace-pre-wrap">{JSON.stringify(fetcher.data, null, 2)}</pre>
        </main>
      )}
    </div>
  );
}

// Loader
export const loader: LoaderFunction = async ({ params }) => {
  const actionCall = await db.query.actionCalls.findFirst({
    where: eq(actionCalls.id, parseInt(params.id as string)),
    with: { action: true },
  });
  return json(actionCall);
};

// For loader errors
export function ErrorBoundary() {
  const error = useRouteError();
  return (
    <main className="flex-1 bg-black text-green-400 p-4 font-mono">
      <pre className="whitespace-pre-wrap">{JSON.stringify(error, null, 2)}</pre>
    </main>
  );
}

// Route Component
export default function Route() {
  const actionCall = useLoaderData<typeof loader>();
  return (
    <div className="flex flex-col gap-4">
      <GoNextButton actionCall={actionCall} />
    </div>
  );
}
