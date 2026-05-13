import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-8 border-t border-[var(--border)] bg-white px-4 py-6 text-center text-xs text-[var(--muted-foreground)]">
      <p className="mb-2 font-medium text-[#ff9600]">
        ⚠️ 本アプリは教育目的のシミュレーションです。実際の投資を推奨するものではありません。
      </p>
      <p className="mb-3">投資は自己責任で行い、損失についての責任は負いかねます。</p>
      <Link href="/terms" className="hover:underline">
        利用規約・免責事項
      </Link>
    </footer>
  );
}
