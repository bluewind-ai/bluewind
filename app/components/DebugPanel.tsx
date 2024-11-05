// app/components/DebugPanel.tsx

import { ErrorDisplay } from "~/components/ErrorDisplay";

type DebugPanelProps = {
  debugMessage: string | null;
};

export function DebugPanel({ debugMessage }: DebugPanelProps) {
  return (
    <div className="absolute inset-0 bg-[#1e1e1e] overflow-auto mt-16 error-display-container">
      {debugMessage && <ErrorDisplay error={debugMessage} />}
      <div style={{ minHeight: "200px" }} />
    </div>
  );
}
