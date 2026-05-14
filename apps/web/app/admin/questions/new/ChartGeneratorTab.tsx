'use client';

import { useState, useTransition } from 'react';
import { ORDER_BOOK_PATTERNS } from '@invest-training/core';
import { previewChart, createChartQuestion } from './chartActions';
import type { PreviewResult } from './chartActions';

type Unit = { unitId: string; unitTitle: string; lessonTitle: string };

export function ChartGeneratorTab({ allUnits }: { allUnits: Unit[] }) {
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreviewing, startPreview] = useTransition();
  const [isSubmitting, startSubmit] = useTransition();

  const [symbol, setSymbol] = useState('7203.T');
  const [endDatetime, setEndDatetime] = useState('');
  const [timeframe, setTimeframe] = useState<'5m' | '1m'>('5m');
  const [orderBookPattern, setOrderBookPattern] = useState(ORDER_BOOK_PATTERNS[0]!.patternName);
  const [unitId, setUnitId] = useState(allUnits[0]?.unitId ?? '');
  const [correctChoiceId, setCorrectChoiceId] = useState<'a' | 'b' | 'c'>('a');
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState(3);
  const [tags, setTags] = useState('');

  function handlePreview() {
    setPreviewError(null);
    const fd = new FormData();
    fd.set('symbol', symbol);
    fd.set('endDatetime', endDatetime);
    fd.set('timeframe', timeframe);
    fd.set('orderBookPattern', orderBookPattern);
    startPreview(async () => {
      const result = await previewChart(fd);
      if ('error' in result) {
        setPreviewError(result.error);
        setPreview(null);
      } else {
        setPreview(result);
        setCorrectChoiceId(result.suggestedAnswer);
      }
    });
  }

  function handleSubmit() {
    if (!preview || !unitId || !correctChoiceId) return;
    const fd = new FormData();
    fd.set('symbol', symbol);
    fd.set('endDatetime', endDatetime);
    fd.set('timeframe', timeframe);
    fd.set('orderBookPattern', orderBookPattern);
    fd.set('unitId', unitId);
    fd.set('correctChoiceId', correctChoiceId);
    fd.set('explanation', explanation);
    fd.set('difficulty', String(difficulty));
    fd.set('tags', tags);
    startSubmit(async () => {
      await createChartQuestion(fd);
    });
  }

  return (
    <div className="space-y-6">
      {/* --- データ入力 --- */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-bold text-[var(--foreground)]">
            銘柄コード（東証）<span className="ml-1 text-[#ff4b4b]">*</span>
          </label>
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="例: 7203.T"
            className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm focus:border-[#58cc02] focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-bold text-[var(--foreground)]">時間足</label>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as '5m' | '1m')}
            className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm focus:border-[#58cc02] focus:outline-none"
          >
            <option value="5m">5分足</option>
            <option value="1m">1分足</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-bold text-[var(--foreground)]">
          表示終点日時（この時点までのチャートを出題）<span className="ml-1 text-[#ff4b4b]">*</span>
        </label>
        <input
          type="datetime-local"
          value={endDatetime}
          onChange={(e) => setEndDatetime(e.target.value)}
          className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm focus:border-[#58cc02] focus:outline-none"
        />
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          5分足は最大60日前まで、1分足は最大7日前まで取得可能
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-bold text-[var(--foreground)]">
          板パターン
        </label>
        <select
          value={orderBookPattern}
          onChange={(e) => setOrderBookPattern(e.target.value)}
          className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm focus:border-[#58cc02] focus:outline-none"
        >
          {ORDER_BOOK_PATTERNS.map((p) => (
            <option key={p.patternName} value={p.patternName}>
              {p.patternName} — {p.description}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handlePreview}
        disabled={isPreviewing || !symbol || !endDatetime}
        className="w-full rounded-xl border-2 border-[#1cb0f6] py-3 text-sm font-bold text-[#1cb0f6] transition-all hover:bg-[#e8f7ff] disabled:opacity-50"
      >
        {isPreviewing ? 'データ取得中...' : 'プレビュー生成'}
      </button>

      {previewError && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{previewError}</div>
      )}

      {/* --- プレビュー表示 --- */}
      {preview && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="mb-1 text-xs font-bold text-[var(--muted-foreground)]">
                チャートプレビュー
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(preview.chartSvg)}`}
                alt="生成されたチャートプレビュー"
                className="w-full rounded-xl"
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-bold text-[var(--muted-foreground)]">板プレビュー</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(preview.orderBookSvg)}`}
                alt={`模擬板: ${orderBookPattern}`}
                className="w-full rounded-xl"
              />
            </div>
          </div>

          <div className="rounded-xl bg-[#fff8e6] px-4 py-3 text-sm">
            <span className="font-bold text-[#ff9600]">30分後の値動き: </span>
            <span className={preview.priceChangePct >= 0 ? 'text-[#26a69a]' : 'text-[#ef5350]'}>
              {preview.priceChangePct >= 0 ? '+' : ''}
              {preview.priceChangePct.toFixed(2)}%
            </span>
            <span className="ml-2 text-[var(--muted-foreground)]">
              → 推奨正解:{' '}
              {preview.suggestedAnswer === 'a'
                ? '🟢 買い'
                : preview.suggestedAnswer === 'b'
                  ? '🔴 空売り'
                  : '⬜ 見送り'}
            </span>
          </div>

          {/* --- 問題設定 --- */}
          <div>
            <label className="mb-1.5 block text-sm font-bold text-[var(--foreground)]">
              ユニット<span className="ml-1 text-[#ff4b4b]">*</span>
            </label>
            <select
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm focus:border-[#58cc02] focus:outline-none"
            >
              {allUnits.map((u) => (
                <option key={u.unitId} value={u.unitId}>
                  {u.lessonTitle} / {u.unitTitle}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-[var(--foreground)]">
              正解（推奨値を確認・変更可）
            </label>
            <div className="space-y-2 rounded-xl border border-[var(--border)] p-4">
              {[
                { id: 'a' as const, label: '🟢 買い（ロング）' },
                { id: 'b' as const, label: '🔴 空売り（ショート）' },
                { id: 'c' as const, label: '⬜ 見送り（ノーポジ）' },
              ].map((choice) => (
                <label key={choice.id} className="flex cursor-pointer items-center gap-3">
                  <input
                    type="radio"
                    name="correctChoiceIdChart"
                    value={choice.id}
                    checked={correctChoiceId === choice.id}
                    onChange={() => setCorrectChoiceId(choice.id)}
                    className="accent-[#58cc02]"
                  />
                  <span className="text-sm text-[var(--foreground)]">{choice.label}</span>
                  {preview.suggestedAnswer === choice.id && (
                    <span className="ml-auto text-xs font-bold text-[#58cc02]">← AI推奨</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-[var(--foreground)]">
              解説文<span className="ml-1 text-[#ff4b4b]">*</span>
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              required
              rows={4}
              placeholder="Claude Code に「この問題の解説文を書いて」と依頼してコピー&ペーストしてください"
              className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm focus:border-[#58cc02] focus:outline-none"
            />
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              プレビューのチャート情報をもとに Claude Code で生成した解説を貼り付けてください
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-[var(--foreground)]">
              難易度
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={1}
                max={5}
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                className="flex-1 accent-[#58cc02]"
              />
              <span className="text-sm font-bold">★ × {difficulty}</span>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-[var(--foreground)]">
              タグ（カンマ区切り）
            </label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="ゴールデンクロス, 大陽線, 出来高急増"
              className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm focus:border-[#58cc02] focus:outline-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !unitId || !explanation.trim()}
            className="font-nunito w-full rounded-xl bg-[#58cc02] py-3 text-sm font-bold text-white shadow-[0_4px_0_#3fa800] transition-all active:translate-y-[4px] active:shadow-none disabled:opacity-50"
          >
            {isSubmitting ? '登録中...' : '問題を登録する'}
          </button>
        </>
      )}
    </div>
  );
}
