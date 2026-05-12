import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import './globals.css';

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
});

export const metadata: Metadata = {
  title: 'Invest Training App',
  description: 'デイトレードを楽しく学べるアプリ',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={nunito.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
