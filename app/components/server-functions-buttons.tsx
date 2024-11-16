// app/components/server-functions-buttons.tsx
import { useFetcher } from "@remix-run/react";

import { Button } from "./ui/button";

const FUNCTIONS = [
  { name: "truncateDb", label: "Truncate DB", variant: "destructive" },
  { name: "bootstrap", label: "Bootstrap DB", variant: "outline" },
] as const;
export function ServerFunctionsButtons() {
  const goNextFetcher = useFetcher();
  const loadFilesFetcher = useFetcher();
  const resetFetcher = useFetcher();
  const truncateFetcher = useFetcher();
  const bootstrapFetcher = useFetcher();
  const generateRoutesFetcher = useFetcher();
  const fetcherMap = {
    goNext: goNextFetcher,
    loadFiles: loadFilesFetcher,
    resetAll: resetFetcher,
    truncateDb: truncateFetcher,
    bootstrap: bootstrapFetcher,
    generateRoutes: generateRoutesFetcher,
  };
  return (
    <div className="flex gap-2 p-4 flex-wrap">
      {FUNCTIONS.map(({ name, label, variant }) => {
        const fetcher = fetcherMap[name as keyof typeof fetcherMap];
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
