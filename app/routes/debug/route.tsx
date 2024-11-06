// app/routes/debug/route.tsx

export default function Debug() {
  return (
    <div className="w-[500px] border-l bg-[#1e1e1e] overflow-auto">
      <div className="text-green-400 font-mono p-4">
        <h1 className="text-2xl mb-6">Debug Panel</h1>
        <div className="space-y-6">
          <div className="border border-green-400/20 rounded p-4">
            <div className="text-sm text-green-400/80">Errors will appear here</div>
          </div>
        </div>
      </div>
    </div>
  );
}
