import { type ReactElement, useState } from 'react';
import type { NextPageWithLayout } from 'types';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import env from '@/lib/env';
import { useRouter } from 'next/router';

const Home: NextPageWithLayout = () => {
  const router = useRouter();
  const { query } = router;
  const [activeTab, setActiveTab] = useState<'video' | 'iframe'>('video');

  // Construct the URL with query parameters
  const url = `https://app.windmill.dev/public/bluewind/75b0edf176041cde9fdd1d4d333202aa?${new URLSearchParams(
    query as Record<string, string>
  ).toString()}`;

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <div style={{ textAlign: 'center', margin: '1rem 0', padding: '2rem' }}>
        <div>
          <button
            onClick={() => setActiveTab('video')}
            style={{
              backgroundColor: activeTab === 'video' ? 'lightblue' : 'white',
              padding: '0.5rem 1rem',
              border: 'none',
              borderBottom: activeTab === 'video' ? '2px solid blue' : 'none',
              cursor: 'pointer',
              marginRight: '1rem',
            }}
          >
            Info
          </button>
          <button
            onClick={() => setActiveTab('iframe')}
            style={{
              backgroundColor: activeTab === 'iframe' ? 'lightblue' : 'white',
              padding: '0.5rem 1rem',
              border: 'none',
              borderBottom: activeTab === 'iframe' ? '2px solid blue' : 'none',
              cursor: 'pointer',
            }}
          >
            Try the automation
          </button>
        </div>
      </div>
      {activeTab === 'video' && (
        <div style={{ position: 'relative', paddingTop: '45%' }}>
          <iframe
            src="https://www.youtube.com/embed/HtK-UJXDli0"
            title="YouTube Video"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            }}
            allowFullScreen
          ></iframe>
        </div>
      )}
      {activeTab === 'iframe' && (
        <iframe
          src={url}
          title="Product Frame"
          width="100%"
          height="100%"
          style={{ border: 'none' }}
        ></iframe>
      )}
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
