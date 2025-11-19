// src/app/layout.tsx
import "../../styles/globals.css";
import type { ReactNode } from 'react';
import ClientProviders from './ClientProviders';
import { Poppins } from 'next/font/google';
import { Noto_Sans_SC } from 'next/font/google';

// Load your font (pick weights you actually use)
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
});

const notoSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
});

export const metadata = {
  title: 'BirchwoodCorp',
  description: 'Real Estate Listings',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full">
      {/* Apply the font to the whole app via body className */}
      <body className={`${poppins.className} ${notoSC.className} h-full bg-gray-light text-rich-black`}>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
