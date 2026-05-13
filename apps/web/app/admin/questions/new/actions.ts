'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

const FIXED_CHOICES = [
  { id: 'a', label: '🟢 買い（ロング）' },
  { id: 'b', label: '🔴 空売り（ショート）' },
  { id: 'c', label: '⬜ 見送り（ノーポジ）' },
] as const;

export async function createQuestion(formData: FormData) {
  const supabase = await createClient();

  const unitId = formData.get('unitId') as string;
  const type = (formData.get('type') as string) || 'chart';
  const prompt = formData.get('prompt') as string;
  const correctChoiceId = formData.get('correctChoiceId') as string;
  const explanation = formData.get('explanation') as string;
  const difficulty = parseInt(formData.get('difficulty') as string, 10);
  const tagsRaw = formData.get('tags') as string;
  const tags = tagsRaw
    ? tagsRaw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  let chartImageUrl: string | null = null;
  const imageFile = formData.get('chartImage') as File | null;

  if (imageFile && imageFile.size > 0) {
    const ext = imageFile.name.split('.').pop() ?? 'jpg';
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('chart-images')
      .upload(path, imageFile, { contentType: imageFile.type });

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('chart-images').getPublicUrl(path);
      chartImageUrl = urlData.publicUrl;
    }
  }

  const { error } = await supabase.from('questions').insert({
    unit_id: unitId,
    type,
    chart_image_url: chartImageUrl,
    prompt,
    choices: FIXED_CHOICES,
    correct_choice_id: correctChoiceId,
    explanation,
    difficulty,
    tags,
  });

  if (error) {
    redirect(`/admin/questions/new?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/admin/questions');
}
