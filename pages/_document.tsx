import { Head, Html, Main, NextScript } from 'next/document';
import { Analytics } from '@vercel/analytics/react';

export default function Document() {
  return (
    <Html lang="en" className="h-full" data-theme="boxyhq">
      <Head />
      <body className="h-full">
        <Main />
        <NextScript />
        <Analytics />
      </body>
    </Html>
  );
}
