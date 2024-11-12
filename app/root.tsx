// app/root.tsx

import "./tailwind.css";

import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
} from "@remix-run/react";

function Document({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        <div className="flex h-full">
          <div className="flex-1">{children}</div>
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  let errorOutput = "";

  if (isRouteErrorResponse(error)) {
    errorOutput = `${error.status} ${error.statusText}\n${JSON.stringify(error.data, null, 2)}`;
  } else if (error instanceof Error) {
    // Special handling for dd() calls
    if (error.message.startsWith("DD_DEBUG_BREAK: ")) {
      const [debugData, ...stackParts] = error.message
        .replace("DD_DEBUG_BREAK: ", "")
        .split("\n\n");
      const stack = stackParts.join("\n\n");

      const formattedStack = stack
        .split("\n")
        .map((line) => {
          if (!line.includes("debug.ts")) {
            // Skip debug.ts lines
            const match = line.match(/\((.*?):(\d+):(\d+)\)/) || line.match(/at (.*?):(\d+):(\d+)/);

            if (match) {
              const [_, filePath, line, col] = match;
              // Only include app paths
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

      errorOutput = `${debugData}\n\n${formattedStack}`;
    } else {
      // Regular error handling
      const stackLines = error.stack
        ?.split("\n")
        .map((line) => {
          if (!line.includes("debug.ts")) {
            // Skip debug.ts lines
            const match = line.match(/\((.*?):(\d+):(\d+)\)/) || line.match(/at (.*?):(\d+):(\d+)/);

            if (match) {
              const [_, filePath, line, col] = match;
              // Only include app paths
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

      errorOutput = `${error.name}: ${error.message}\n\n${stackLines}`;
    }
  } else {
    errorOutput = JSON.stringify(error, null, 2);
  }

  return (
    <Document>
      <div className="p-4 font-mono">
        <div
          className="text-red-500 whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: errorOutput }}
        />
      </div>
    </Document>
  );
}

export default function App() {
  return (
    <Document>
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </Document>
  );
}
