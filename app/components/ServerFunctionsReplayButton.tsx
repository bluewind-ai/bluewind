// app/components/ServerFunctionsReplayButton.tsx

import { useNavigate } from "@remix-run/react";

import { Button } from "~/components/ui/button";

interface ServerFunctionsReplayButtonProps {
  requestId: number;
}

export function ServerFunctionsReplayButton({ requestId }: ServerFunctionsReplayButtonProps) {
  const navigate = useNavigate();

  const handleReplayClick = async () => {
    try {
      const response = await fetch("http://localhost:5173/api/replay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      const data = await response.json();
      if (data.requestId) {
        navigate(`/requests/${data.requestId}`);
      }
    } catch (error) {
      console.error("Replay error:", error);
    }
  };

  return (
    <Button onClick={handleReplayClick} variant="default" className="w-full">
      Replay
    </Button>
  );
}
