// app/components/server-functions-buttons.tsx

import { useFetcher } from "@remix-run/react";

import { SERVER_FUNCTIONS, type ServerFunctionName } from "~/lib/server-functions";

import { Button } from "./ui/button";

export function ServerFunctionsButtons() {
  const fetchers = Object.keys(SERVER_FUNCTIONS).reduce(
    (acc, name) => ({
      ...acc,
      [name]: useFetcher(),
    }),
    {} as Record<ServerFunctionName, ReturnType<typeof useFetcher>>,
  );

  return (
    <div className="flex gap-2 p-4 flex-wrap">
      {Object.entries(SERVER_FUNCTIONS).map(([name, { label, variant }]) => {
        const fetcher = fetchers[name as ServerFunctionName];
        const isLoading = fetcher.state !== "idle";

        return (
          <fetcher.Form key={name} method="post" action="/function-calls">
            <input type="hidden" name="function" value={name} />
            <Button type="submit" variant={variant} disabled={isLoading}>
              {isLoading ? "Running..." : label}
            </Button>
          </fetcher.Form>
        );
      })}
    </div>
  );
}
