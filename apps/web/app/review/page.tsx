import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { LearnClient } from '../learn/[unitId]/LearnClient';

export default async function ReviewPage() {
  const supabase = await createClient();

  const { data: incorrectAttempts } = await supabase
    .from('attempts')
    .select('question_id')
    .eq('is_correct', false)
    .order('answered_at', { ascending: false })
    .limit(20);

  if (!incorrectAttempts || incorrectAttempts.length === 0) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-[var(--background)] px-6 text-center">
        <span className="text-5xl">🎉</span>
        <h1 className="font-nunito text-2xl font-extrabold text-[var(--foreground)]">
          復習する問題はありません
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          不正解の問題がないため、ハートは自動で満タンです！
        </p>
        <Link
          href="/"
          className="font-nunito mt-2 rounded-xl bg-[#58cc02] px-8 py-3 font-bold text-white shadow-[0_4px_0_#3fa800] active:translate-y-[4px] active:shadow-none"
        >
          ホームに戻る
        </Link>
      </div>
    );
  }

  const candidateIds = [...new Set(incorrectAttempts.map((a) => a.question_id))];
  const randomId = candidateIds[Math.floor(Math.random() * candidateIds.length)];

  if (!randomId) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Link href="/" className="text-[#58cc02]">
          ← ホームに戻る
        </Link>
      </div>
    );
  }

  const { data: question } = await supabase
    .from('questions')
    .select('id, unit_id, type, chart_image_url, prompt, choices, difficulty')
    .eq('id', randomId)
    .single();

  if (!question) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Link href="/" className="text-[#58cc02]">
          ← ホームに戻る
        </Link>
      </div>
    );
  }

  const { data: profile } = await supabase.from('profiles').select('xp, hearts').single();

  const typedQuestion = {
    id: question.id,
    type: question.type as 'chart' | 'order_book' | 'volume',
    chartImageUrl: question.chart_image_url,
    prompt: question.prompt,
    choices: question.choices as { id: string; label: string }[],
    difficulty: question.difficulty,
  };

  return (
    <div>
      <div className="bg-[#fff8e6] px-4 py-2 text-center text-sm font-bold text-[#ff9600]">
        ❤️‍🩹 ハート回復モード — 正解で +1 回復
      </div>
      <LearnClient
        unitId={question.unit_id}
        unitTitle="復習"
        questions={[typedQuestion]}
        initialXp={profile?.xp ?? 0}
        initialHearts={profile?.hearts ?? 5}
      />
    </div>
  );
}
