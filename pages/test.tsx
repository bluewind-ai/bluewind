import { type ReactElement } from 'react';
import type { NextPageWithLayout } from 'types';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import FeatureSection from '@/components/defaultLanding/FeatureSection';
import env from '@/lib/env';

const Home: NextPageWithLayout = () => {
  const url = `https://app.windmill.dev/public/bluewind/20eff918b834eabeca5a4acda38760d6`;
  return (
    <div className="p-3">
      {/* Example iframe embedding a sample website */}
      <iframe
        src={url}
        title="Product Frame"
        width="100%"
        height="500px"
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
