// app/components/ActivityBar.tsx

import { useNavigate } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Network, Play, Table } from "lucide-react";
import { Logo } from "~/components/icons/logo";
import { cn } from "~/lib/utils";
import type { InferSelectModel } from "drizzle-orm";
import { actionCalls } from "~/db/schema";

type ActionCall = InferSelectModel<typeof actionCalls>;

export function ActivityBar({ className }: { className?: string; lastAction?: ActionCall }) {
  const navigate = useNavigate();

  return (
    <div className={cn("flex flex-col gap-2 p-2 bg-muted w-12 border-r border-border", className)}>
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10"
        onClick={() => navigate("/action-calls")}
      >
        <Logo />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10"
        onClick={() => navigate("/action-calls")}
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
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10"
        onClick={() => navigate("/sandbox")}
      >
        <Table className="h-5 w-5" />
      </Button>
    </div>
  );
}
