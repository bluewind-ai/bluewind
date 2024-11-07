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
  console.log("loader params:", params);

  if (!params.id || isNaN(Number(params.id))) {
    throw new Response("Invalid ID", { status: 400 });
  }

  const actionCall = await db.query.actionCalls.findFirst({
    where: eq(actionCalls.id, parseInt(params.id)),
    with: { action: true },
  });

  console.log("loader actionCall:", actionCall);
  return json(actionCall);
};

export const action: ActionFunction = async ({ params }) => {
  if (!params.id || isNaN(Number(params.id))) {
    return json({ error: "Invalid ID" }, { status: 400 });
  }

  const id = parseInt(params.id);

  await db.update(actionCalls).set({ status: "completed" }).where(eq(actionCalls.id, id));

  return json({ success: true });
};

export default function Route() {
  const actionCall = useLoaderData<typeof loader>();
  console.log("component actionCall:", actionCall);

  return (
    <div className="flex flex-col gap-4">
      <GoNextButton actionCall={actionCall} />
    </div>
  );
}
