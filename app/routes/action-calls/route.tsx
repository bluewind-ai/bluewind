// app/routes/action-calls/route.tsx

import { Outlet, useLoaderData, useNavigate } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Network, Play, GitBranch, Bug, PackageSearch } from "lucide-react";
import { Logo } from "~/components/icons/logo";
import { json, type LoaderFunction } from "@remix-run/node";
import { db } from "~/db";
import { actionCalls } from "~/db/schema";
import { eq } from "drizzle-orm";
import { cn } from "~/lib/utils";
import type { InferSelectModel } from "drizzle-orm";

type ActionCall = InferSelectModel<typeof actionCalls>;

// Layout Loader
export const loader: LoaderFunction = async () => {
  dd("loader");
  const lastAction = await db.query.actionCalls.findFirst({
    where: eq(actionCalls.status, "ready_for_approval"),
    with: { action: true },
  });
  return json({ lastAction });
};

// Activity Bar Component
function ActivityBar({ className, lastAction }: { className?: string; lastAction?: ActionCall }) {
  const navigate = useNavigate();
  return (
    <div className={cn("flex flex-col gap-2 p-2 bg-muted w-12", className)}>
      <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => navigate("/")}>
        <Logo />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10"
        onClick={() => lastAction && navigate(`/action-calls/${lastAction.id}`)}
      >
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

// Layout Component
export default function ActionCallsLayout() {
  const { lastAction } = useLoaderData<typeof loader>();
  return (
    <div className="flex min-h-screen">
      <div className="w-12">
        <ActivityBar lastAction={lastAction} />
      </div>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
