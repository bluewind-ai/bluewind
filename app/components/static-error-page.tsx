// app/components/static-error-page.tsx

export function StaticErrorPage({ error }: { error: Error }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Error</title>
      </head>
      <body className="h-full">
        <div className="p-4 font-mono">
          <div className="text-red-500">
            <h1>Error: {error.message}</h1>
            <pre>{error.stack}</pre>
          </div>
        </div>
      </body>
    </html>
  );
}
