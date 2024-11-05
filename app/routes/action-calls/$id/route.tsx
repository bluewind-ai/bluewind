// app/routes/action-calls/$id/route.tsx

export function ErrorBoundary() {
  const error = useRouteError();

  let errorContent;
  try {
    errorContent = typeof error.data === "string" ? JSON.parse(error.data) : error.data;
  } catch {
    errorContent = error.data || error;
  }

  return (
    <div className="flex min-h-screen">
      <ActivityBar />
      <main className="flex-1 bg-black text-green-400 p-4 font-mono">
        <pre className="whitespace-pre-wrap">{JSON.stringify(errorContent, null, 2)}</pre>
      </main>
    </div>
  );
}
