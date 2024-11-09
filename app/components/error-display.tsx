// app/components/error-display.tsx

import { useRouteError, isRouteErrorResponse } from "@remix-run/react";

export function ErrorDisplay() {
  const error = useRouteError();

  return (
    <div
      style={{
        padding: "1rem",
        overflow: "auto",
        maxHeight: "100vh",
        userSelect: "none",
      }}
    >
      <pre
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          userSelect: "text",
        }}
      >
        {isRouteErrorResponse(error)
          ? error.data
          : error instanceof Error
            ? `${error.name}: ${error.message}\n\n${error.stack}`
            : "Unknown error"}
      </pre>
    </div>
  );
}
