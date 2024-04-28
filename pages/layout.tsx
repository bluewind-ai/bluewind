import { Analytics } from '@vercel/analytics/react';
import Head from 'next/head';
import { PHProvider } from './providers';
import dynamic from 'next/dynamic';

const PostHogPageView = dynamic(() => import('./PostHogPageView'), {
  ssr: false,
});
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
      <PHProvider>
        <body>
          <PostHogPageView />

          {children}
          <Analytics />
        </body>
      </PHProvider>
    </html>
  );
}
