import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-nunito text-lg font-extrabold text-[var(--foreground)]">
              🛠 管理画面
            </span>
            <nav className="flex gap-4 text-sm">
              <Link
                href="/admin/questions"
                className="font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                問題一覧
              </Link>
              <Link
                href="/admin/questions/new"
                className="font-medium text-[#58cc02] hover:opacity-80"
              >
                + 新規作成
              </Link>
            </nav>
          </div>
          <Link href="/" className="text-sm text-[var(--muted-foreground)] hover:underline">
            ← アプリに戻る
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">{children}</main>
    </div>
  );
}
