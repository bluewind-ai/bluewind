// app/components/GoNextButton.tsx

import { Button } from "~/components/ui/button";
import { useFetcher, isRouteErrorResponse } from "@remix-run/react";
import type { actionCalls } from "~/db/schema";
import type { InferSelectModel } from "drizzle-orm";
import { cn } from "~/lib/utils";
import { type ButtonProps } from "~/components/ui/button";
import { DebugPanel } from "~/components/DebugPanel";

type ActionCall = InferSelectModel<typeof actionCalls>;

interface GoNextButtonProps extends ButtonProps {
  actionCall: ActionCall;
  className?: string;
}

export function GoNextButton({ actionCall, className, ...props }: GoNextButtonProps) {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state === "submitting";
  const hasError = fetcher.data && fetcher.data[1] === "error";

  const getErrorMessage = () => {
    if (!hasError) return null;
    return fetcher.data[3] as string;
  };

  return (
    <div className="flex flex-col gap-2">
      <fetcher.Form method="post" action={`/action-calls/${actionCall.id}`}>
        <Button
          type="submit"
          className={cn("bg-primary text-primary-foreground hover:bg-primary/90", className)}
          disabled={isSubmitting}
          {...props}
        >
          {isSubmitting ? "Processing..." : actionCall.status === "completed" ? "Next" : "Approve"}
        </Button>
      </fetcher.Form>
      {hasError && <DebugPanel data={getErrorMessage()} />}
    </div>
  );
}
