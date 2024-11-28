// app/components/server-functions-buttons.tsx

import { useNavigate } from "@remix-run/react";

import { TableModel } from "~/db/schema/table-models";
import type { ButtonVariant } from "~/lib/server-functions-types";

import { Button } from "./ui/button";

interface ServerFunctionsButtonsProps {
  [TableModel.SERVER_FUNCTIONS]: Array<{
    id: number;
    name: string;
    type: string;
    metadata: {
      label: string;
      variant: ButtonVariant;
    } | null;
  }>;
}

export function ServerFunctionsButtons({
  [TableModel.SERVER_FUNCTIONS]: serverFunctions,
}: ServerFunctionsButtonsProps) {
  const navigate = useNavigate();

  const handleRootClick = async () => {
    const response = await fetch("http://localhost:5173/api/run-route/root", {
      method: "POST",
    });

    if (response.ok) {
      const data = await response.json();
      navigate(`/requests/${data.requestId}`);
    }
  };

  return (
    <div className="flex gap-2 p-4 flex-wrap">
      <Button onClick={handleRootClick} variant="default">
        Root
      </Button>
      {serverFunctions.map((fn) => {
        const label = typeof fn.metadata?.label === "string" ? fn.metadata.label : fn.name;
        const variant =
          typeof fn.metadata?.variant === "string"
            ? (fn.metadata.variant as ButtonVariant)
            : "default";
        return (
          <form key={fn.name} method="post" action={`/api/run-route/${fn.name}`}>
            <input type="hidden" name="function" value={fn.name} />
            <Button type="submit" variant={variant}>
              {label}
            </Button>
          </form>
        );
      })}
    </div>
  );
}
