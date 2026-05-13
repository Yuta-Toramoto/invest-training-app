import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { LearnClient } from './LearnClient';

type Props = { params: Promise<{ unitId: string }> };

export default async function LearnPage({ params }: Props) {
  const { unitId } = await params;
  const supabase = await createClient();

  const { data: unit } = await supabase
    .from('units')
    .select('id, title, lesson_id')
    .eq('id', unitId)
    .single();

  if (!unit) notFound();

  const { data: questions } = await supabase
    .from('questions')
    .select('id, type, chart_image_url, prompt, choices, difficulty')
    .eq('unit_id', unitId)
    .order('created_at');

  if (!questions || questions.length === 0) notFound();

  const { data: profile } = await supabase
    .from('profiles')
    .select('xp, hearts, current_streak')
    .single();

  const typedQuestions = questions.map((q) => ({
    id: q.id,
    type: q.type as 'chart' | 'order_book' | 'volume',
    chartImageUrl: q.chart_image_url,
    prompt: q.prompt,
    choices: q.choices as { id: string; label: string }[],
    difficulty: q.difficulty,
  }));

  return (
    <LearnClient
      unitId={unitId}
      unitTitle={unit.title}
      questions={typedQuestions}
      initialXp={profile?.xp ?? 0}
      initialHearts={profile?.hearts ?? 5}
    />
  );
}
