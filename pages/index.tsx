import { useState } from "react";
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { GetServerSideProps, GetServerSidePropsContext } from 'next';
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Gallery from "../components/Gallery";
import Testimonials from "../components/Testimonials";
import BookMeeting from "../components/BookMeeting";
import Footer from "../components/Footer";

const navLinks = [
  { name: "Landing", href: "#" },
  { name: "Pages", href: "#" },
  { name: "Contact", href: "#" },
  { name: "About", href: "#" },
];

export default function Home() {
  return (
    <div className="font-body">
      <section className="bg-white mb-20 md:mb-52 xl:mb-72">
        <div className="container max-w-screen-xl mx-auto px-4">
          <Navbar />
          <Hero />
        </div>
      </section>
      <section className="bg-white py-10 md:py-16 xl:relative">
        <div className="container max-w-screen-xl mx-auto px-4">
          <Features />
        </div>
      </section>
      <section className="bg-white py-10 md:py-16">
        <div className="container max-w-screen-xl mx-auto px-4">
          <Gallery />
        </div>
      </section>
      <section className="bg-white py-10 md:py-16">
        <Testimonials />
      </section>
      <section className="bg-white py-10 md:py-16">
        <BookMeeting />
      </section>
      <Footer />
    </div>
  );
}
/*
export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
*/
export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const { locale } = context;
  return { 
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
}