import { Analytics } from '@vercel/analytics/react';
import Head from 'next/head';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <Head>
        <title>Next.js</title>
      </Head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
