import Anthropic from '@anthropic-ai/sdk';
import type { Candle, MovingAverage, MockOrderBook } from '@invest-training/core';

const client = new Anthropic({
  apiKey: process.env['ANTHROPIC_API_KEY'],
});

const CHOICE_LABELS: Record<string, string> = {
  a: '買い（ロング）',
  b: '空売り（ショート）',
  c: '見送り（ノーポジション）',
};

type GenerateExplanationInput = {
  symbol: string;
  timeframe: string;
  candles: Candle[];
  mas: MovingAverage[];
  orderBook: MockOrderBook;
  correctChoiceId: string;
  resultCandles: Candle[]; // 表示終点から30分後までのローソク足
};

export async function generateExplanation(input: GenerateExplanationInput): Promise<string> {
  const { symbol, timeframe, candles, mas, orderBook, correctChoiceId, resultCandles } = input;

  const lastCandle = candles.at(-1)!;
  const firstResultCandle = resultCandles[0];
  const lastResultCandle = resultCandles.at(-1);

  const priceChange =
    firstResultCandle && lastResultCandle
      ? (
          ((lastResultCandle.close - firstResultCandle.open) / firstResultCandle.open) *
          100
        ).toFixed(2)
      : '不明';

  const maLines = mas
    .map((ma) => {
      const last = ma.values.at(-1);
      return last ? `${ma.period}MA: ${last.value.toFixed(0)}円` : '';
    })
    .filter(Boolean)
    .join('、');

  const prompt = `あなたはデイトレード教育アプリの解説文を書くアシスタントです。
以下の情報をもとに、2〜3文の日本語解説文を書いてください。

【条件】
- 教育目的の解説であること
- 断定的な投資助言（「必ず上がる」等）を含めないこと
- 初心者にも分かりやすい表現を使うこと
- 「〜でした」「〜だったため」など過去形で記述すること

【チャート情報】
銘柄: ${symbol}
時間足: ${timeframe}
表示終点の価格: ${lastCandle.close.toFixed(0)}円（始値: ${lastCandle.open.toFixed(0)}、高値: ${lastCandle.high.toFixed(0)}、安値: ${lastCandle.low.toFixed(0)}）
移動平均線: ${maLines}
板パターン: ${orderBook.patternName}（${orderBook.description}）

【その後の値動き】
${resultCandles.length > 0 ? `終点から30分後: ${priceChange}%の変動（${lastResultCandle?.close.toFixed(0) ?? '?'}円）` : 'データなし'}

【正解】${CHOICE_LABELS[correctChoiceId] ?? correctChoiceId}

解説文のみを返してください（見出し・箇条書き不要）：`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content?.type !== 'text') {
    throw new Error('Unexpected response type from Claude API');
  }

  return content.text.trim();
}
