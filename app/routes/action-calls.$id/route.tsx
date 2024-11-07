// app/routes/action-calls.$id/route.tsx

import { useLoaderData, useNavigation, Form } from "@remix-run/react";
import { json, type LoaderFunction, type ActionFunction } from "@remix-run/node";
import { db } from "~/db";
import { actionCalls } from "~/db/schema";
import { eq } from "drizzle-orm";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import type { InferSelectModel } from "drizzle-orm";
import type { ButtonProps } from "~/components/ui/button";

type ActionCall = InferSelectModel<typeof actionCalls>;

interface GoNextButtonProps extends ButtonProps {
  actionCall: ActionCall;
  className?: string;
}

function GoNextButton({ actionCall, className, ...props }: GoNextButtonProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  console.log("[GoNextButton] Rendering with actionCall:", actionCall);
  console.log("[GoNextButton] Navigation state:", navigation.state);

  return (
    <Form method="post" replace>
      <Button
        type="submit"
        disabled={isSubmitting}
        className={cn("bg-primary text-primary-foreground hover:bg-primary/90", className)}
        {...props}
      >
        {actionCall.status === "completed" ? "Next" : "Approve"}
      </Button>
    </Form>
  );
}

export const loader: LoaderFunction = async ({ params }) => {
  console.log("[loader] Starting with params:", params);

  if (!params.id || isNaN(Number(params.id))) {
    throw new Response("Invalid ID", { status: 400 });
  }

  const actionCall = await db.query.actionCalls.findFirst({
    where: eq(actionCalls.id, parseInt(params.id)),
    with: { action: true },
  });

  console.log("[loader] Found actionCall:", actionCall);
  return json(actionCall);
};

export const action: ActionFunction = async ({ params }) => {
  console.log("[action] Starting with params:", params);

  if (!params.id || isNaN(Number(params.id))) {
    return json({ error: "Invalid ID" }, { status: 400 });
  }

  const id = parseInt(params.id);

  await db.update(actionCalls).set({ status: "completed" }).where(eq(actionCalls.id, id));
  console.log("[action] Updated actionCall status to completed for id:", id);

  return json({ success: true });
};

export default function Route() {
  const actionCall = useLoaderData<typeof loader>();
  console.log("[Route] Rendering with actionCall:", actionCall);

  return (
    <div className="flex flex-col gap-4">
      <pre className="bg-slate-100 p-4 rounded">{JSON.stringify(actionCall, null, 2)}</pre>
      <GoNextButton actionCall={actionCall} />
    </div>
  );
}
