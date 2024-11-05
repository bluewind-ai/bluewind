// app/components/DebugPanel.tsx

interface DebugPanelProps {
  data: unknown;
}

export function DebugPanel({ data }: DebugPanelProps) {
  return (
    <main className="flex-1 bg-black text-green-400 p-4 font-mono">
      <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
    </main>
  );
}
