// app/routes/action-calls.$id/route.tsx

import { useLoaderData, useNavigation, Form } from "@remix-run/react";
import { json, type LoaderFunction } from "@remix-run/node";
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

  console.log("Navigation state:", navigation.state);
  console.log("Navigation location:", navigation.location);

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
  if (!params.id || isNaN(Number(params.id))) {
    throw new Response("Invalid ID", { status: 400 });
  }

  console.log("Loader called with params:", params);
  const actionCall = await db.query.actionCalls.findFirst({
    where: eq(actionCalls.id, parseInt(params.id)),
    with: { action: true },
  });

  if (!actionCall) {
    throw new Response("Not found", { status: 404 });
  }

  return json(actionCall);
};

export default function Route() {
  const actionCall = useLoaderData<typeof loader>();
  console.log("Route rendering with actionCall:", actionCall);

  return (
    <div className="flex flex-col gap-4">
      <GoNextButton actionCall={actionCall} />
    </div>
  );
}
