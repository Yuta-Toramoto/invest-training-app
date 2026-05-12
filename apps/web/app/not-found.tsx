import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-bold text-gray-900">404 — ページが見つかりません</h2>
      <Link href="/" className="text-blue-500 underline hover:text-blue-600">
        ホームに戻る
      </Link>
    </main>
  );
}
