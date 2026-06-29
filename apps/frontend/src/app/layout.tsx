import type { Metadata } from 'next';
import { Hanken_Grotesk, Instrument_Serif } from 'next/font/google';
import { Providers } from '@/components/Providers';
import './globals.css';

const sans = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});

const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: 'Maison — Style that inspires living',
  description: 'A curated marketplace of objects worth keeping — apparel, home, and the small luxuries in between.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${serif.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
