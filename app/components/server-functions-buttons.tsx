// app/components/server-functions-buttons.tsx

import { useNavigate } from "@remix-run/react";

import { Button } from "~/components/ui/button";

export function ServerFunctionsButtons() {
  const navigate = useNavigate();
  const handleRootClick = async () => {
    try {
      const response = await fetch("http://localhost:5173/api/run-route/root", {
        method: "POST",
      });
      const data = await response.json();
      if (data.requestId) {
        navigate(`/requests/${data.requestId}`);
      }
    } catch (error) {}
  };

  return (
    <div className="flex gap-2 p-4 flex-wrap">
      <Button onClick={handleRootClick} variant="default">
        Root
      </Button>
    </div>
  );
}
