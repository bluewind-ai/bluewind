// app/components/GoNextButton.tsx

import { Button } from "~/components/ui/button";
import { useFetcher } from "@remix-run/react";
import type { actionCalls } from "~/db/schema";
import type { InferSelectModel } from "drizzle-orm";
import { cn } from "~/lib/utils";
import { type ButtonProps } from "~/components/ui/button";
import { useEffect } from "react";

type ActionCall = InferSelectModel<typeof actionCalls>;

interface GoNextButtonProps extends ButtonProps {
  actionCall: ActionCall;
  className?: string;
  onDebugData?: (data: string) => void;
}

type FetcherData = {
  debugMessage?: string;
};

export function GoNextButton({ actionCall, className, onDebugData, ...props }: GoNextButtonProps) {
  const fetcher = useFetcher<FetcherData>();

  useEffect(() => {
    if (fetcher.data?.debugMessage && onDebugData) {
      onDebugData(fetcher.data.debugMessage);
    }
  }, [fetcher.data, onDebugData]);

  return (
    <fetcher.Form method="post" action={`/action-calls/${actionCall.id}`}>
      <Button
        type="submit"
        className={cn("bg-primary text-primary-foreground hover:bg-primary/90", className)}
        {...props}
      >
        {actionCall.status === "completed" ? "Next" : "Approve"}
      </Button>
    </fetcher.Form>
  );
}
