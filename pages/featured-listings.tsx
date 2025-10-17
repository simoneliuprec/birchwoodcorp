import type {
  GetServerSideProps,
  GetServerSidePropsContext
} from 'next';
import Head from 'next/head';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import FeaturedListings from '../components/FeaturedListings';

export default function FeaturedListingsPage() {
  return (
    <main>
      <FeaturedListings />
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const { locale } = context; // locale is string | undefined

  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
};
