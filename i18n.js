'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './public/locales/en/common.json';
import zh from './public/locales/zh/common.json';

import enListings from './public/locales/en/listings.json';
import zhListings from './public/locales/zh/listings.json';

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { listings: enListings },
        zh: { listings: zhListings },
      },
      lng: 'en',
      fallbackLng: 'en',
      defaultNS: 'listings',
      interpolation: { escapeValue: false },
    });
}

export default i18n;
