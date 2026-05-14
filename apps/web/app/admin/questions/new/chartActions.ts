'use server';

import { createClient } from '@/lib/supabase/server';
import { fetchCandles } from '@/lib/market/fetchCandles';
import { generateChartSvg } from '@/lib/market/generateChartSvg';
import { generateOrderBookSvg } from '@/lib/market/generateOrderBookSvg';
import { calculateMA, ORDER_BOOK_PATTERNS } from '@invest-training/core';
import { redirect } from 'next/navigation';

const FIXED_CHOICES = [
  { id: 'a', label: '🟢 買い（ロング）' },
  { id: 'b', label: '🔴 空売り（ショート）' },
  { id: 'c', label: '⬜ 見送り（ノーポジ）' },
] as const;

const DISPLAY_CANDLES = 78; // 5分足 × 78本 = 1取引日分
const RESULT_CANDLES = 6; // その後30分（5分足 × 6本）

export type PreviewResult = {
  chartSvg: string;
  orderBookSvg: string;
  suggestedAnswer: 'a' | 'b' | 'c';
  priceChangePct: number;
  endPrice: number;
};

export async function previewChart(formData: FormData): Promise<PreviewResult | { error: string }> {
  const symbol = (formData.get('symbol') as string | null)?.trim();
  const endDatetimeStr = formData.get('endDatetime') as string | null;
  const timeframe = (formData.get('timeframe') as '5m' | '1m') ?? '5m';
  const orderBookPatternName = formData.get('orderBookPattern') as string | null;

  if (!symbol || !endDatetimeStr) {
    return { error: '銘柄コードと終点日時を入力してください' };
  }

  const endDatetime = new Date(endDatetimeStr);
  const intervalMs = timeframe === '5m' ? 5 * 60 * 1000 : 60 * 1000;
  const totalMs = (DISPLAY_CANDLES + RESULT_CANDLES) * intervalMs;
  const fromDate = new Date(endDatetime.getTime() - (DISPLAY_CANDLES - 1) * intervalMs);
  const toDate = new Date(endDatetime.getTime() + RESULT_CANDLES * intervalMs);

  let allCandles;
  try {
    allCandles = await fetchCandles(symbol, timeframe, fromDate, toDate);
  } catch (e) {
    return { error: `データ取得エラー: ${e instanceof Error ? e.message : String(e)}` };
  }

  if (allCandles.length < 10) {
    return {
      error: `データが不足しています（${allCandles.length}本）。銘柄コードや日時を確認してください。`,
    };
  }

  const endTs = endDatetime.getTime();
  const displayCandles = allCandles.filter((c) => c.timestamp <= endTs).slice(-DISPLAY_CANDLES);
  const resultCandles = allCandles.filter((c) => c.timestamp > endTs).slice(0, RESULT_CANDLES);

  if (displayCandles.length === 0) {
    return { error: '表示用データが取得できませんでした' };
  }

  const ma5 = calculateMA(displayCandles, 5);
  const ma25 = calculateMA(displayCandles, 25);
  const ma75 = calculateMA(displayCandles, 75);

  const chartSvg = generateChartSvg(displayCandles, [ma5, ma25, ma75], symbol);

  const pattern =
    ORDER_BOOK_PATTERNS.find((p) => p.patternName === orderBookPatternName) ??
    ORDER_BOOK_PATTERNS[0]!;
  const endPrice = displayCandles.at(-1)!.close;
  const orderBookSvg = generateOrderBookSvg(pattern, Math.round(endPrice));

  // 30分後の価格変化で正解を自動判定
  let suggestedAnswer: 'a' | 'b' | 'c' = 'c';
  let priceChangePct = 0;
  if (resultCandles.length > 0) {
    const lastResult = resultCandles.at(-1)!;
    priceChangePct = ((lastResult.close - endPrice) / endPrice) * 100;
    if (priceChangePct >= 0.5) suggestedAnswer = 'a';
    else if (priceChangePct <= -0.5) suggestedAnswer = 'b';
    else suggestedAnswer = 'c';
  }

  void totalMs; // used for calculation above

  return { chartSvg, orderBookSvg, suggestedAnswer, priceChangePct, endPrice };
}

export async function createChartQuestion(formData: FormData): Promise<void> {
  const supabase = await createClient();

  const symbol = (formData.get('symbol') as string).trim();
  const endDatetimeStr = formData.get('endDatetime') as string;
  const timeframe = (formData.get('timeframe') as '5m' | '1m') ?? '5m';
  const orderBookPatternName = formData.get('orderBookPattern') as string;
  const unitId = formData.get('unitId') as string;
  const correctChoiceId = formData.get('correctChoiceId') as string;
  const explanation = (formData.get('explanation') as string | null) ?? '';
  const difficulty = parseInt(formData.get('difficulty') as string, 10) || 3;
  const tagsRaw = formData.get('tags') as string;
  const tags = tagsRaw
    ? tagsRaw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const endDatetime = new Date(endDatetimeStr);
  const intervalMs = timeframe === '5m' ? 5 * 60 * 1000 : 60 * 1000;
  const fromDate = new Date(endDatetime.getTime() - (DISPLAY_CANDLES - 1) * intervalMs);
  const toDate = new Date(endDatetime.getTime() + RESULT_CANDLES * intervalMs);

  const allCandles = await fetchCandles(symbol, timeframe, fromDate, toDate);
  const endTs = endDatetime.getTime();
  const displayCandles = allCandles.filter((c) => c.timestamp <= endTs).slice(-DISPLAY_CANDLES);

  const ma5 = calculateMA(displayCandles, 5);
  const ma25 = calculateMA(displayCandles, 25);
  const ma75 = calculateMA(displayCandles, 75);
  const chartSvg = generateChartSvg(displayCandles, [ma5, ma25, ma75], symbol);

  const pattern =
    ORDER_BOOK_PATTERNS.find((p) => p.patternName === orderBookPatternName) ??
    ORDER_BOOK_PATTERNS[0]!;
  const endPrice = displayCandles.at(-1)!.close;
  const orderBookSvg = generateOrderBookSvg(pattern, Math.round(endPrice));

  // SVG を Supabase Storage にアップロード
  async function uploadSvg(svg: string, prefix: string): Promise<string | null> {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const path = `${prefix}-${crypto.randomUUID()}.svg`;
    const { error } = await supabase.storage.from('chart-images').upload(path, blob, {
      contentType: 'image/svg+xml',
    });
    if (error) return null;
    const { data } = supabase.storage.from('chart-images').getPublicUrl(path);
    return data.publicUrl;
  }

  const [chartImageUrl, orderBookImageUrl] = await Promise.all([
    uploadSvg(chartSvg, 'chart'),
    uploadSvg(orderBookSvg, 'orderbook'),
  ]);

  const prompt = `${symbol}の${timeframe === '5m' ? '5分足' : '1分足'}チャートです。この後30分で株価はどうなるでしょうか？`;

  const { error } = await supabase.from('questions').insert({
    unit_id: unitId,
    type: 'chart',
    chart_image_url: chartImageUrl,
    order_book_image_url: orderBookImageUrl,
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
