import { createClient } from '@/lib/supabase/server';
import { createQuestion } from './actions';

export default async function NewQuestionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, units(id, title)')
    .order('order');

  const allUnits = (lessons ?? []).flatMap((l) =>
    ((l.units as { id: string; title: string }[] | null) ?? []).map((u) => ({
      unitId: u.id,
      unitTitle: u.title,
      lessonTitle: l.title,
    })),
  );

  return (
    <div className="max-w-2xl">
      <h1 className="font-nunito mb-6 text-2xl font-extrabold text-[var(--foreground)]">
        問題を作成
      </h1>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          エラー: {decodeURIComponent(error)}
        </div>
      )}

      <form className="space-y-6">
        {/* ユニット選択 */}
        <Field label="ユニット" required>
          <select
            name="unitId"
            required
            className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm focus:border-[#58cc02] focus:outline-none"
          >
            <option value="">選択してください</option>
            {allUnits.map((u) => (
              <option key={u.unitId} value={u.unitId}>
                {u.lessonTitle} / {u.unitTitle}
              </option>
            ))}
          </select>
        </Field>

        {/* 問題タイプ */}
        <Field label="タイプ">
          <select
            name="type"
            className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm focus:border-[#58cc02] focus:outline-none"
          >
            <option value="chart">チャート</option>
            <option value="order_book">板情報</option>
            <option value="volume">出来高</option>
          </select>
        </Field>

        {/* チャート画像 */}
        <Field label="チャート画像">
          <input
            name="chartImage"
            type="file"
            accept="image/*"
            className="w-full text-sm text-[var(--muted-foreground)] file:mr-4 file:rounded-lg file:border-0 file:bg-[#58cc02] file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:opacity-90"
          />
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            省略した場合はプレースホルダーが表示されます
          </p>
        </Field>

        {/* 問題文 */}
        <Field label="問題文" required>
          <textarea
            name="prompt"
            required
            rows={3}
            placeholder="この場面、あなたならどうする？"
            className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm focus:border-[#58cc02] focus:outline-none"
          />
        </Field>

        {/* 選択肢（固定表示） */}
        <div>
          <label className="mb-2 block text-sm font-bold text-[var(--foreground)]">
            選択肢（固定）
          </label>
          <div className="space-y-2 rounded-xl border border-[var(--border)] p-4">
            {[
              { id: 'a', label: '🟢 買い（ロング）' },
              { id: 'b', label: '🔴 空売り（ショート）' },
              { id: 'c', label: '⬜ 見送り（ノーポジ）' },
            ].map((choice) => (
              <label key={choice.id} className="flex cursor-pointer items-center gap-3">
                <input
                  type="radio"
                  name="correctChoiceId"
                  value={choice.id}
                  required
                  className="accent-[#58cc02]"
                />
                <span className="text-sm text-[var(--foreground)]">{choice.label}</span>
                <span className="ml-auto text-xs font-medium text-[#58cc02] opacity-0 peer-checked:opacity-100">
                  ← 正解
                </span>
              </label>
            ))}
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">
              ラジオボタンで正解を選択してください
            </p>
          </div>
        </div>

        {/* 解説 */}
        <Field label="解説" required>
          <textarea
            name="explanation"
            required
            rows={3}
            placeholder="なぜその選択が正解なのかを説明してください"
            className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm focus:border-[#58cc02] focus:outline-none"
          />
        </Field>

        {/* 難易度 */}
        <Field label="難易度">
          <div className="flex items-center gap-4">
            <input
              name="difficulty"
              type="range"
              min={1}
              max={5}
              defaultValue={2}
              className="flex-1 accent-[#58cc02]"
            />
            <span className="text-sm font-bold text-[var(--foreground)]">★ × ?</span>
          </div>
          <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
            <span>やさしい</span>
            <span>ふつう</span>
            <span>むずかしい</span>
          </div>
        </Field>

        {/* タグ */}
        <Field label="タグ（カンマ区切り）">
          <input
            name="tags"
            type="text"
            placeholder="ピンバー, 大陽線, ブレイクアウト"
            className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm focus:border-[#58cc02] focus:outline-none"
          />
        </Field>

        <div className="flex gap-3 pt-2">
          <button
            formAction={createQuestion}
            className="font-nunito flex-1 rounded-xl bg-[#58cc02] py-3 text-sm font-bold text-white shadow-[0_4px_0_#3fa800] transition-all active:translate-y-[4px] active:shadow-none"
          >
            作成する
          </button>
          <a
            href="/admin/questions"
            className="flex-1 rounded-xl border border-[var(--border)] py-3 text-center text-sm font-bold text-[var(--muted-foreground)] hover:bg-[var(--background)]"
          >
            キャンセル
          </a>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-bold text-[var(--foreground)]">
        {label}
        {required && <span className="ml-1 text-[#ff4b4b]">*</span>}
      </label>
      {children}
    </div>
  );
}
