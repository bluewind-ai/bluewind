import { type ReactElement } from 'react';
import type { NextPageWithLayout } from 'types';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import FeatureSection from '@/components/defaultLanding/FeatureSection';
import env from '@/lib/env';
import { useRouter } from 'next/router';

const Home: NextPageWithLayout = () => {
  const router = useRouter();
  const { query } = router;

  // Construct the URL with query parameters
  const url = `https://app.windmill.dev/public/bluewind/75b0edf176041cde9fdd1d4d333202aa?${new URLSearchParams(
    query as Record<string, string>
  ).toString()}`;

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {/* Example iframe embedding a sample website */}
      <iframe
        src={url}
        title="Product Frame"
        width="100%"
        height="100%"
        style={{ border: 'none' }}
      ></iframe>
    </div>
  );
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  // Redirect to login page if landing page is disabled
  if (env.hideLandingPage) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: true,
      },
    };
  }

  const { locale } = context;
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
};

Home.getLayout = function getLayout(page: ReactElement) {
  return <>{page}</>;
};

export default Home;
