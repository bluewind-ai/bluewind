// app/routes/action-calls.$id/route.tsx

import { useLoaderData, useNavigation, Form } from "@remix-run/react";
import { json, type LoaderFunction, type ActionFunction } from "@remix-run/node";
import { db } from "~/db";
import { actionCalls } from "~/db/schema";
import { eq } from "drizzle-orm";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { master } from "~/actions/master.server";
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

// Loader
export const loader: LoaderFunction = async ({ params }) => {
  console.log("Loader called with params:", params);
  const actionCall = await db.query.actionCalls.findFirst({
    where: eq(actionCalls.id, parseInt(params.id as string)),
    with: { action: true },
  });
  return json(actionCall);
};

// Action
export const action: ActionFunction = async ({ params }) => {
  console.log("Action called with params:", params);
  dd("Request");
  // @ts-expect-error - We are not using the request object
  const result = await master({ id: parseInt(params.id as string) });
  return json(result);
};

// Route Component
export default function Route() {
  const actionCall = useLoaderData<typeof loader>();
  console.log("Route rendering with actionCall:", actionCall);

  return (
    <div className="flex flex-col gap-4">
      <GoNextButton actionCall={actionCall} />
    </div>
  );
}
