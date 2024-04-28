import { Head, Html, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en" className="h-full" data-theme="boxyhq">
      <Head>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body className="h-full">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
