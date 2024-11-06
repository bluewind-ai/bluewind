// app/root.tsx

import { type LinksFunction } from "@remix-run/node";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react";

import tailwindStylesheetUrl from "./tailwind.css?url";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: tailwindStylesheetUrl }];

export default function App() {
  return (
    <AppLayout>
      <div className="flex min-h-screen">
        <div className="flex-1">
          <Outlet />
        </div>
        <div className="w-[500px] border-l bg-[#1e1e1e]">
          <div className="h-full text-green-400 font-mono p-4 overflow-auto">
            <h1 className="text-2xl mb-6">Debug Panel</h1>
            <pre className="whitespace-pre-wrap">Hello World</pre>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
