// app/components/ErrorDisplay.tsx

import { useEffect, useState } from "react";

const basePath = "/Users/merwanehamadi/code/bluewind-2";

function formatErrorForDisplay(message: string): string {
  const lines = message
    .split("\n")
    .map((line) => {
      // Skip unwanted lines
      if (
        line.includes("node_modules") ||
        line.includes("processTicksAndRejections") ||
        line.includes("Array.map") ||
        line.includes("internal/process")
      ) {
        return null;
      }

      // Look for app file paths in the line
      const match = line.match(/\((.*?)\/app\/(.*?):(\d+):(\d+)\)/);
      if (match) {
        const [, , relativePath, lineNum, col] = match;
        return line.replace(
          /\(.*?\)/,
          `(<a href="vscode://file/${basePath}/app/${relativePath}:${lineNum}:${col}" style="color: #6688cc; text-decoration: none;">app/${relativePath}:${lineNum}:${col}</a>)`,
        );
      }
      return line;
    })
    .filter(Boolean) // Remove null lines
    .join("\n");

  // Add proper spacing and formatting
  return lines.replace(/Debug Data:/, "\nDebug Data:\n").replace(/Stack:/, "\nStack Trace:\n");
}

export function ErrorDisplay({ error }: { error: string }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <pre className="p-4 font-mono text-sm whitespace-pre-wrap text-white">{error}</pre>;
  }

  return (
    <div
      style={{
        fontFamily: "monospace",
        whiteSpace: "pre-wrap",
        padding: "20px",
        background: "#1e1e1e",
        color: "#f14c4c",
      }}
    >
      <div
        dangerouslySetInnerHTML={{
          __html: formatErrorForDisplay(error),
        }}
        style={{ lineHeight: "1.5" }}
      />
    </div>
  );
}
