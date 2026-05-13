import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminQuestionsPage() {
  const supabase = await createClient();

  const { data: questions } = await supabase
    .from('questions')
    .select(
      `
      id,
      prompt,
      difficulty,
      type,
      units ( title, lessons ( title ) )
    `,
    )
    .order('created_at', { ascending: false });

  const questionIds = (questions ?? []).map((q) => q.id);

  const { data: attempts } = await supabase
    .from('attempts')
    .select('question_id, is_correct')
    .in(
      'question_id',
      questionIds.length > 0 ? questionIds : ['00000000-0000-0000-0000-000000000000'],
    );

  const statsMap = new Map<string, { total: number; correct: number }>();
  for (const a of attempts ?? []) {
    const s = statsMap.get(a.question_id) ?? { total: 0, correct: 0 };
    s.total += 1;
    if (a.is_correct) s.correct += 1;
    statsMap.set(a.question_id, s);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-nunito text-2xl font-extrabold text-[var(--foreground)]">問題一覧</h1>
        <Link
          href="/admin/questions/new"
          className="rounded-xl bg-[#58cc02] px-4 py-2 text-sm font-bold text-white shadow-[0_3px_0_#3fa800] hover:opacity-90 active:translate-y-[3px] active:shadow-none"
        >
          + 新規作成
        </Link>
      </div>

      {!questions || questions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white py-16 text-center">
          <p className="text-[var(--muted-foreground)]">問題がまだありません。</p>
          <Link
            href="/admin/questions/new"
            className="mt-2 inline-block text-sm text-[#58cc02] hover:underline"
          >
            最初の問題を作成する →
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--background)] text-left text-xs text-[var(--muted-foreground)]">
                <th className="px-4 py-3 font-medium">問題文</th>
                <th className="px-4 py-3 font-medium">ユニット</th>
                <th className="px-4 py-3 font-medium">難易度</th>
                <th className="px-4 py-3 text-right font-medium">回答数</th>
                <th className="px-4 py-3 text-right font-medium">正答率</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {questions.map((q) => {
                const stats = statsMap.get(q.id);
                const accuracy =
                  stats && stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : null;
                const unit = Array.isArray(q.units) ? q.units[0] : q.units;
                const unitLessons = unit && 'lessons' in unit ? unit.lessons : undefined;
                const lesson = Array.isArray(unitLessons) ? unitLessons[0] : unitLessons;

                return (
                  <tr key={q.id} className="hover:bg-[var(--background)]">
                    <td className="max-w-xs px-4 py-3">
                      <p className="truncate font-medium text-[var(--foreground)]">{q.prompt}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{q.type}</p>
                    </td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">
                      <p>{unit?.title ?? '—'}</p>
                      <p className="text-xs">{lesson?.title ?? ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      <DifficultyBadge level={q.difficulty} />
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--muted-foreground)]">
                      {stats?.total ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {accuracy !== null ? (
                        <span
                          className={`font-bold ${accuracy >= 60 ? 'text-[#58cc02]' : 'text-[#ff4b4b]'}`}
                        >
                          {accuracy}%
                        </span>
                      ) : (
                        <span className="text-[var(--muted-foreground)]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DifficultyBadge({ level }: { level: number }) {
  const colors = [
    '',
    'bg-green-100 text-green-700',
    'bg-lime-100 text-lime-700',
    'bg-yellow-100 text-yellow-700',
    'bg-orange-100 text-orange-700',
    'bg-red-100 text-red-700',
  ];
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${colors[level] ?? ''}`}>
      {'★'.repeat(level)}
    </span>
  );
}
