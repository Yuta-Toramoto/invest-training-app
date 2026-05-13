import { createClient } from '@/lib/supabase/server';
import { Footer } from '@/components/Footer';
import { HeartBar } from '@invest-training/ui';
import Link from 'next/link';

export default async function HomePage() {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, xp, current_streak, hearts')
    .single();

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, order, difficulty, units(id, title, order)')
    .order('order');

  const allUnitIds = (lessons ?? []).flatMap((l) =>
    ((l.units as { id: string }[]) ?? []).map((u) => u.id),
  );

  const { data: questions } = await supabase
    .from('questions')
    .select('unit_id, id')
    .in('unit_id', allUnitIds.length > 0 ? allUnitIds : ['00000000-0000-0000-0000-000000000000']);

  const { data: attempts } = await supabase.from('attempts').select('question_id');

  const answeredIds = new Set((attempts ?? []).map((a) => a.question_id));
  const questionsByUnit = new Map<string, string[]>();
  for (const q of questions ?? []) {
    const list = questionsByUnit.get(q.unit_id) ?? [];
    list.push(q.id);
    questionsByUnit.set(q.unit_id, list);
  }

  const needsHeartRecovery = (profile?.hearts ?? 5) < 5;

  return (
    <div className="min-h-svh bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="font-nunito text-lg font-extrabold text-[var(--foreground)]">
              📈 トレ学
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-sm font-bold text-[#ffc800]">
              🔥 {profile?.current_streak ?? 0}
            </span>
            <span className="text-sm font-bold text-[#58cc02]">⚡ {profile?.xp ?? 0} XP</span>
            <HeartBar hearts={profile?.hearts ?? 5} />
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-lg px-4 py-6">
        {/* ハート回復バナー */}
        {needsHeartRecovery && (
          <Link
            href="/review"
            className="mb-6 flex items-center gap-3 rounded-2xl border-2 border-[#ff4b4b] bg-[#fff0f0] px-4 py-3 transition-opacity hover:opacity-90"
          >
            <span className="text-2xl">❤️‍🩹</span>
            <div className="flex-1">
              <p className="font-nunito text-sm font-bold text-[#cc0000]">ハートを回復しよう</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                復習問題に正解してハートを +1
              </p>
            </div>
            <span className="text-[var(--muted-foreground)]">→</span>
          </Link>
        )}

        {/* ナビリンク */}
        <div className="mb-8 flex gap-3">
          <Link
            href="/leaderboard"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white py-3 text-sm font-bold text-[var(--foreground)] shadow-sm hover:bg-[var(--background)]"
          >
            🏆 ランキング
          </Link>
          <Link
            href="/profile"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white py-3 text-sm font-bold text-[var(--foreground)] shadow-sm hover:bg-[var(--background)]"
          >
            👤 プロフィール
          </Link>
        </div>

        {/* レッスンツリー */}
        <div className="space-y-2">
          {(lessons ?? []).map((lesson) => {
            const units = (
              (lesson.units as { id: string; title: string; order: number }[]) ?? []
            ).sort((a, b) => a.order - b.order);

            return (
              <div key={lesson.id}>
                {/* レッスン見出し */}
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-px flex-1 bg-[var(--border)]" />
                  <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-1.5">
                    <span className="text-sm">{'🌱📗📘📙📕'[lesson.order - 1] ?? '📚'}</span>
                    <span className="font-nunito text-sm font-bold text-[var(--foreground)]">
                      {lesson.title}
                    </span>
                  </div>
                  <div className="h-px flex-1 bg-[var(--border)]" />
                </div>

                {/* ユニットボタン */}
                <div className="mb-6 space-y-3">
                  {units.map((unit, unitIdx) => {
                    const qids = questionsByUnit.get(unit.id) ?? [];
                    const answered = qids.filter((id) => answeredIds.has(id)).length;
                    const completed = qids.length > 0 && answered >= qids.length;
                    const inProgress = answered > 0 && !completed;

                    return (
                      <Link
                        key={unit.id}
                        href={`/learn/${unit.id}`}
                        className={[
                          'flex items-center gap-4 rounded-2xl border-2 px-5 py-4 transition-all',
                          unitIdx % 2 === 0 ? 'ml-0 mr-8' : 'ml-8 mr-0',
                          completed
                            ? 'border-[#3fa800] bg-[#d7ffb8] shadow-[0_3px_0_#3fa800]'
                            : 'border-[var(--border)] bg-white shadow-[0_3px_0_#e5e5e5] hover:border-[#58cc02]',
                        ].join(' ')}
                      >
                        <div
                          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold ${
                            completed
                              ? 'bg-[#58cc02] text-white'
                              : inProgress
                                ? 'bg-[#ffc800] text-white'
                                : 'bg-[var(--background)] text-[var(--muted-foreground)]'
                          }`}
                        >
                          {completed ? '✓' : inProgress ? '▶' : unit.order}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`font-nunito truncate text-sm font-bold ${completed ? 'text-[#3fa800]' : 'text-[var(--foreground)]'}`}
                          >
                            {unit.title}
                          </p>
                          {qids.length > 0 && (
                            <p className="text-xs text-[var(--muted-foreground)]">
                              {completed ? '完了' : `${answered} / ${qids.length} 問`}
                            </p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {(!lessons || lessons.length === 0) && (
            <div className="py-16 text-center text-[var(--muted-foreground)]">
              <p className="text-4xl">📚</p>
              <p className="mt-2 text-sm">レッスンがまだありません</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
