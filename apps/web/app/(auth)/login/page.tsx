import { login, loginWithGoogle } from './actions';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-[var(--border)] bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="font-nunito text-2xl font-bold text-[var(--foreground)]">ログイン</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            アカウントにログインしてください
          </p>
        </div>

        <form className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-[var(--foreground)]">
              メールアドレス
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="focus:ring-[var(--green-500)]/20 w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[var(--green-500)] focus:ring-2"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-[var(--foreground)]">
              パスワード
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="focus:ring-[var(--green-500)]/20 w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[var(--green-500)] focus:ring-2"
              placeholder="••••••••"
            />
          </div>

          <button
            formAction={login}
            className="w-full rounded-xl bg-[var(--green-500)] py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 active:opacity-80"
          >
            ログイン
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--border)]" />
          </div>
          <div className="relative flex justify-center text-xs text-[var(--muted-foreground)]">
            <span className="bg-white px-2">または</span>
          </div>
        </div>

        <form>
          <button
            formAction={loginWithGoogle}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-[var(--border)] py-3 text-sm font-medium transition-colors hover:bg-gray-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google でログイン
          </button>
        </form>

        <p className="text-center text-sm text-[var(--muted-foreground)]">
          アカウントをお持ちでない方は{' '}
          <a href="/signup" className="font-medium text-[var(--green-500)] hover:underline">
            新規登録
          </a>
        </p>
      </div>
    </div>
  );
}
