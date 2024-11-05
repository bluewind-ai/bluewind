// app/components/DebugPanel.tsx

interface DebugPanelProps {
  debugMessage: string | null;
}

export function DebugPanel({ debugMessage }: DebugPanelProps) {
  if (!debugMessage) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black text-green-400 p-4 font-mono text-sm overflow-auto max-h-[50vh]">
      <pre className="whitespace-pre-wrap">{debugMessage}</pre>
    </div>
  );
}
