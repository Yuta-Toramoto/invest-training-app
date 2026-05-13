import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'トレ学 — デイトレ学習アプリ',
    short_name: 'トレ学',
    description: 'ローソク足・チャートパターンを楽しく学ぶ無料アプリ',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f7f7f7',
    theme_color: '#58cc02',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
