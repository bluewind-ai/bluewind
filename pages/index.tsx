import { useEffect, type ReactElement } from 'react';
import type { NextPageWithLayout } from 'types';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import HeroSection from '@/components/defaultLanding/HeroSection';
import env from '@/lib/env';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AlbumCard from '@/components/CardAutomation';

import Tags from '@/components/defaultLanding/Tags';

const Home: NextPageWithLayout = () => {
  const router = useRouter();

  useEffect(() => {
    const url = new URL(router.asPath, window.location.href);
    const hash = url.hash;
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
        });
      }
    }
  }, [router.asPath]);

  return (
    <>
      <Head>
        <title>Open-source AI automations to grow your business</title>
      </Head>

      <div className="container mx-auto">
        <HeroSection />
        <Tags />
        <AlbumCard />
        {/* <PricingTable /> */}
        {/* <PricingTable2 />
        <FAQ /> */}
        {/* <div className="divider"></div> */}
        {/* <FeatureSection /> */}
        {/* <div className="divider"></div> */}
        {/* <PricingSection />
        <div className="divider"></div>
        <FAQSection /> */}
      </div>
    </>
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
