// app/components/activity-bar.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Network, Play, GitBranch, Bug, PackageSearch } from "lucide-react";
import { useNavigate } from "@remix-run/react";
import { Logo } from "~/components/icons/logo";

interface ActivityBarProps {
  className?: string;
  lastAction?: any; // Made optional
}

export function ActivityBar({ className, lastAction }: ActivityBarProps) {
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
