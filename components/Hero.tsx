'use client';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';

export default function Hero() {
  const { t } = useTranslation('common');
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center bg-gray-900">
      <img
        src="/assets/image/hero.jpg"
        alt={t('heroAlt')}
        className="absolute inset-0 w-full h-full object-cover object-center opacity-70"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/80" />
      <div className="relative z-10 max-w-3xl mx-auto p-8 text-center">
        <h1 className="font-serif text-4xl md:text-6xl font-extrabold text-white drop-shadow-lg mb-6 tracking-tight">
          {t('heroTitle')}
        </h1>
        <p className="font-sans font-light italic text-lg md:text-2xl text-white/80 mb-8">
          {t('heroSubtitle')}
        </p>
        <Link
          href="/featured-listings/"
          className="inline-block px-8 py-3 rounded-lg bg-white text-gray-900 font-semibold text-lg shadow-lg hover:bg-gray-200 transition"
        >
          {t('featuredListings')}
        </Link>
      </div>
    </section>
  );
};