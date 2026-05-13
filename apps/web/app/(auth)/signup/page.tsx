import { signup } from './actions';

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-[var(--border)] bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="font-nunito text-2xl font-bold text-[var(--foreground)]">新規登録</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            無料でアカウントを作成しましょう
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
              autoComplete="new-password"
              minLength={8}
              className="focus:ring-[var(--green-500)]/20 w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[var(--green-500)] focus:ring-2"
              placeholder="8文字以上"
            />
          </div>

          <button
            formAction={signup}
            className="w-full rounded-xl bg-[var(--green-500)] py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 active:opacity-80"
          >
            登録する
          </button>
        </form>

        <p className="text-center text-sm text-[var(--muted-foreground)]">
          すでにアカウントをお持ちの方は{' '}
          <a href="/login" className="font-medium text-[var(--green-500)] hover:underline">
            ログイン
          </a>
        </p>
      </div>
    </div>
  );
}
