// app/components/DebugPanel.tsx

interface DebugPanelProps {
  debugMessage: string | null;
}

export function DebugPanel({ debugMessage }: DebugPanelProps) {
  if (!debugMessage) return null;

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[80%] max-w-2xl bg-black text-green-400 p-4 rounded-lg shadow-lg font-mono text-sm overflow-auto max-h-[400px]">
      <pre className="whitespace-pre-wrap">{debugMessage}</pre>
    </div>
  );
}
