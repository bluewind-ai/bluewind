// app/components/error-display-static.tsx

import React from "react";

function Document({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Error</title>
      </head>
      <body className="h-full">{children}</body>
    </html>
  );
}

export function ErrorDisplayStatic({ error }: { error: Error }) {
  let errorOutput = "";
  if (error.message.startsWith("DD_DEBUG_BREAK: ")) {
    const [debugData, ...stackParts] = error.message.replace("DD_DEBUG_BREAK: ", "").split("\n\n");
    const stack = stackParts.join("\n\n");
    const formattedStack = stack
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
    errorOutput = `${debugData}\n\n${formattedStack}`;
  } else {
    const stackLines = error.stack
      ?.split("\n")
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
    errorOutput = `${error.name}: ${error.message}\n\n${stackLines}`;
  }

  return (
    <Document>
      <div className="p-4 font-mono">
        <div
          className="text-red-500 whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: errorOutput }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.error = ${JSON.stringify({
              message: error.message,
              stack: error.stack,
            })};`,
          }}
        />
      </div>
    </Document>
  );
}
