// app/components/server-functions-buttons.tsx

import { useFetcher } from "@remix-run/react";

import { TableModel } from "~/db/schema/table-models";
import type { ButtonVariant } from "~/lib/server-functions-types";
import type { loader } from "~/root";

import { Button } from "./ui/button";

interface ServerFunctionsButtonsProps {
  [TableModel.SERVER_FUNCTIONS]: Awaited<
    ReturnType<typeof loader>
  >[typeof TableModel.SERVER_FUNCTIONS];
}

type ServerFunction = {
  id: number;
  name: string;
  type: string;
  metadata: {
    label: string;
    variant: ButtonVariant;
  } | null;
};

export function ServerFunctionsButtons({
  [TableModel.SERVER_FUNCTIONS]: serverFunctions,
}: ServerFunctionsButtonsProps) {
  const fetcher = useFetcher(); // Use a single fetcher instead of multiple ones

  return (
    <div className="flex gap-2 p-4 flex-wrap">
      {(serverFunctions as ServerFunction[]).map((fn) => {
        const isLoading = fetcher.state !== "idle" && fetcher.formData?.get("function") === fn.name;

        return (
          <fetcher.Form key={fn.name} method="post" action="/function-calls">
            <input type="hidden" name="function" value={fn.name} />
            <Button type="submit" variant={fn.metadata?.variant ?? "default"} disabled={isLoading}>
              {isLoading ? "Running..." : (fn.metadata?.label ?? fn.name)}
            </Button>
          </fetcher.Form>
        );
      })}
    </div>
  );
}
