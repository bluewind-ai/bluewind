// app/components/server-functions-buttons.tsx

import { useFetcher } from "@remix-run/react";

import { Button } from "./ui/button";

export function ServerFunctionsButtons() {
  const goNextFetcher = useFetcher();
  const loadFilesFetcher = useFetcher();
  const resetFetcher = useFetcher();
  const truncateFetcher = useFetcher();
  const bootstrapFetcher = useFetcher();
  const generateRoutesFetcher = useFetcher();
  const truncateCallFetcher = useFetcher();

  const isResetting = resetFetcher.state !== "idle";
  const isTruncating = truncateFetcher.state !== "idle";
  const isBootstrapping = bootstrapFetcher.state !== "idle";
  const isTruncatingCall = truncateCallFetcher.state !== "idle";

  return (
    <div className="flex gap-2 p-4 flex-wrap">
      <goNextFetcher.Form method="post" action="/function-calls">
        <input type="hidden" name="function" value="goNext" />
        <Button type="submit" variant="outline" disabled={goNextFetcher.state !== "idle"}>
          {goNextFetcher.state !== "idle" ? "Running..." : "Go Next"}
        </Button>
      </goNextFetcher.Form>

      <loadFilesFetcher.Form method="post" action="/function-calls">
        <input type="hidden" name="function" value="loadFiles" />
        <Button type="submit" variant="outline" disabled={loadFilesFetcher.state !== "idle"}>
          {loadFilesFetcher.state !== "idle" ? "Loading..." : "Load Files"}
        </Button>
      </loadFilesFetcher.Form>

      <resetFetcher.Form method="post" action="/api/reset-all">
        <Button variant="destructive" type="submit" disabled={isResetting}>
          {isResetting ? "Resetting..." : "Reset All"}
        </Button>
      </resetFetcher.Form>

      <truncateFetcher.Form method="post" action="/api/truncate-db">
        <Button variant="destructive" type="submit" disabled={isTruncating}>
          {isTruncating ? "Resetting..." : "Truncate DB"}
        </Button>
      </truncateFetcher.Form>

      <bootstrapFetcher.Form method="post" action="/api/bootstrap">
        <Button type="submit" variant="outline" disabled={isBootstrapping}>
          {isBootstrapping ? "Bootstrapping..." : "Bootstrap DB"}
        </Button>
      </bootstrapFetcher.Form>

      <generateRoutesFetcher.Form action="/api/generate-routes">
        <Button type="submit" variant="outline" disabled={generateRoutesFetcher.state !== "idle"}>
          {generateRoutesFetcher.state !== "idle" ? "Generating..." : "Generate All Routes"}
        </Button>
      </generateRoutesFetcher.Form>

      <truncateCallFetcher.Form method="post" action="/function-calls">
        <input type="hidden" name="function" value="truncateDb" />
        <Button variant="destructive" type="submit" disabled={isTruncatingCall}>
          {isTruncatingCall ? "Truncating..." : "Truncate DB (New)"}
        </Button>
      </truncateCallFetcher.Form>
    </div>
  );
}
