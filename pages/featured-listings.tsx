import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import FeaturedListings from '../components/FeaturedListings';

export default function FeaturedListingsPage() {
  return (
    <main>
      <FeaturedListings />
    </main>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}