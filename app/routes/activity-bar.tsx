// app/routes/activity-bar.tsx

import { useNavigate } from "@remix-run/react";
import { json, type LoaderFunction } from "@remix-run/node";
import { db } from "~/db";
import { actionCalls } from "~/db/schema";
import { eq } from "drizzle-orm";
import { Button } from "~/components/ui/button";
import { Network, Play, GitBranch, Bug, PackageSearch } from "lucide-react";
import { Logo } from "~/components/icons/logo";
import { cn } from "~/lib/utils";
import type { InferSelectModel } from "drizzle-orm";

type ActionCall = InferSelectModel<typeof actionCalls>;

export const loader: LoaderFunction = async () => {
  const lastAction = await db.query.actionCalls.findFirst({
    where: eq(actionCalls.status, "ready_for_approval"),
    with: { action: true },
  });

  return json({ lastAction });
};

export function ActivityBar({
  className,
  lastAction,
}: {
  className?: string;
  lastAction?: ActionCall;
}) {
  const navigate = useNavigate();

  const handleNetworkClick = () => {
    if (lastAction) {
      navigate(`/action-calls/${lastAction.id}`);
    }
  };

  return (
    <div className={cn("flex flex-col gap-2 p-2 bg-muted w-12", className)}>
      <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => navigate("/")}>
        <Logo />
      </Button>
      <Button variant="ghost" size="icon" className="h-10 w-10" onClick={handleNetworkClick}>
        <Network className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10"
        onClick={() => navigate("/actions/master")}
      >
        <Play className="h-5 w-5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-10 w-10">
        <GitBranch className="h-5 w-5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-10 w-10">
        <Bug className="h-5 w-5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-10 w-10">
        <PackageSearch className="h-5 w-5" />
      </Button>
    </div>
  );
}

export default ActivityBar;
