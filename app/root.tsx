// app/root.tsx

import { type LinksFunction } from "@remix-run/node";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react";

import tailwindStylesheetUrl from "./tailwind.css?url";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: tailwindStylesheetUrl }];

export default function App() {
  return (
    <AppLayout>
      <div className="flex min-h-screen">
        <Outlet />
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
