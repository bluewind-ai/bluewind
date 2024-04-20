import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { NextPageWithLayout } from 'types';

const Products: NextPageWithLayout = (uuid) => {
  const url = `https://app.windmill.dev/public/bluewind/${uuid}`;
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

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export default Products;
