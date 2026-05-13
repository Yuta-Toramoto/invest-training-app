import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { LearnClient } from '../learn/[unitId]/LearnClient';

export default async function ReviewPage() {
  const supabase = await createClient();

  const { data: incorrectAttempts } = await supabase
    .from('attempts')
    .select('question_id')
    .eq('is_correct', false)
    .order('answered_at', { ascending: false })
    .limit(20);

  if (!incorrectAttempts || incorrectAttempts.length === 0) notFound();

  const candidateIds = [...new Set(incorrectAttempts.map((a) => a.question_id))];
  const randomId = candidateIds[Math.floor(Math.random() * candidateIds.length)];
  if (!randomId) notFound();

  const { data: question } = await supabase
    .from('questions')
    .select('id, unit_id, type, chart_image_url, prompt, choices, difficulty')
    .eq('id', randomId)
    .single();

  if (!question) notFound();

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
