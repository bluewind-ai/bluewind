// app/utils/error-utils.tsx
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  useRouteError,
} from "@remix-run/react";
import React from "react";

function formatStack(stack: string) {
  return stack
    .split("\n")
    .map((line) => {
      if (!line.includes("debug.ts")) {
        const match = line.match(/\((.*?):(\d+):(\d+)\)/) || line.match(/at (.*?):(\d+):(\d+)/);
        if (match) {
          const [_, filePath, line, col] = match;
          if (filePath.includes("/app/")) {
            const cleanPath = filePath.replace("/Users/merwanehamadi/code/bluewind/", "");
            return `    at <a href="vscode://file${filePath}:${line}:${col}" class="text-blue-500 hover:underline">${cleanPath}:${line}:${col}</a>`;
          }
        }
      }
      return null;
    })
    .filter(Boolean)
    .join("\n");
}
function formatError(error: unknown) {
  if (error instanceof Error) {
    if (error.message.startsWith("DD_DEBUG_BREAK: ")) {
      const [debugData, ...stackParts] = error.message
        .replace("DD_DEBUG_BREAK: ", "")
        .split("\n\n");
      const stack = stackParts.join("\n\n");
      const formattedStack = formatStack(stack);
      return `${debugData}\n\n${formattedStack}`;
    } else {
      const stackLines = formatStack(error.stack || "");
      return `${error.name}: ${error.message}\n\n${stackLines}`;
    }
  }
  return JSON.stringify(error, null, 2);
}
interface ErrorWrapperProps {
  children: React.ReactNode;
  includeRemixAssets?: boolean;
}
function ErrorWrapper({ children, includeRemixAssets = false }: ErrorWrapperProps) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Error</title>
        {includeRemixAssets && (
          <>
            <Meta />
            <Links />
          </>
        )}
      </head>
      <body className="h-full">
        {children}
        {includeRemixAssets && (
          <>
            <ScrollRestoration />
            <Scripts />
          </>
        )}
      </body>
    </html>
  );
}
function ErrorDisplay({ error }: { error: unknown }) {
  let errorOutput = "";
  if (isRouteErrorResponse(error)) {
    errorOutput = `${error.status} ${error.statusText}\n${JSON.stringify(error.data, null, 2)}`;
  } else {
    errorOutput = formatError(error);
  }
  return (
    <div className="p-4 font-mono">
      <div
        className="text-red-500 whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: errorOutput }}
      />
    </div>
  );
}
// For Remix error boundary
export function RemixErrorBoundary() {
  const error = useRouteError();
  return (
    <ErrorWrapper includeRemixAssets>
      <ErrorDisplay error={error} />
    </ErrorWrapper>
  );
}
// For Hono/static errors
export function StaticErrorPage({ error }: { error: Error }) {
  return (
    <ErrorWrapper>
      <ErrorDisplay error={error} />
    </ErrorWrapper>
  );
}
