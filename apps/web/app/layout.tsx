import { TrpcProvider } from '@/components/providers/TrpcProvider';
import { PostHogProvider } from '@/components/providers/PostHogProvider';
import type { Metadata, Viewport } from 'next';
import { Nunito } from 'next/font/google';
import './globals.css';

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
});

export const metadata: Metadata = {
  title: 'トレ学 — デイトレ学習アプリ',
  description:
    'ローソク足・チャートパターンを楽しく学ぶ無料アプリ。教育目的のシミュレーションです。',
  applicationName: 'トレ学',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'トレ学' },
};

export const viewport: Viewport = {
  themeColor: '#58cc02',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={nunito.variable}>
      <body className="font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[#58cc02] focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
        >
          メインコンテンツへスキップ
        </a>
        <PostHogProvider>
          <TrpcProvider>{children}</TrpcProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
