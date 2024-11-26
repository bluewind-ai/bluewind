// app/components/server-functions-buttons.tsx

import { useFetcher } from "@remix-run/react";

import { TableModel } from "~/db/schema/table-models";
import type { ButtonVariant } from "~/lib/server-functions-types";

import { Button } from "./ui/button";

interface ServerFunctionsButtonsProps {
  [TableModel.SERVER_FUNCTIONS]: Array<{
    id: number;
    name: string;
    type: string;
    metadata: {
      label: string;
      variant: ButtonVariant;
    } | null;
  }>;
}

export function ServerFunctionsButtons({
  [TableModel.SERVER_FUNCTIONS]: serverFunctions,
}: ServerFunctionsButtonsProps) {
  const fetcher = useFetcher();
  return (
    <div className="flex gap-2 p-4 flex-wrap">
      {serverFunctions.map((fn) => {
        const isLoading = fetcher.state !== "idle" && fetcher.formData?.get("function") === fn.name;
        // Extract values from metadata or use defaults
        const label = typeof fn.metadata?.label === "string" ? fn.metadata.label : fn.name;
        const variant =
          typeof fn.metadata?.variant === "string"
            ? (fn.metadata.variant as ButtonVariant)
            : "default";
        return (
          <fetcher.Form key={fn.name} method="post" action={`/run-route/${fn.name}`}>
            <Button type="submit" variant={variant} disabled={isLoading}>
              {isLoading ? "Running..." : label}
            </Button>
          </fetcher.Form>
        );
      })}
    </div>
  );
}
