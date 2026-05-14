'use client';

import { useCallback, useRef, useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { DuoButton } from '@invest-training/ui';

const WEEKLY_GOAL_OPTIONS = [50, 100, 250] as const;
type WeeklyGoalOption = (typeof WEEKLY_GOAL_OPTIONS)[number];

function isWeeklyGoalOption(v: number): v is WeeklyGoalOption {
  return (WEEKLY_GOAL_OPTIONS as readonly number[]).includes(v);
}

type Props = {
  currentWeeklyGoalXp: number;
  weeklyXp: number;
};

export function GoalSettingModal({ currentWeeklyGoalXp, weeklyXp }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<WeeklyGoalOption>(
    isWeeklyGoalOption(currentWeeklyGoalXp) ? currentWeeklyGoalXp : 100,
  );
  const backdropRef = useRef<HTMLDivElement>(null);
  const { capture } = useAnalytics();

  const setGoalMutation = trpc.profile.setGoal.useMutation({
    onSuccess: () => {
      capture({
        name: 'goal_setting_changed',
        props: { from_xp: currentWeeklyGoalXp, to_xp: selected },
      });
      setOpen(false);
      window.location.reload();
    },
  });

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === backdropRef.current) setOpen(false);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false);
  }, []);

  const progressPercent = Math.min(100, Math.floor((weeklyXp / currentWeeklyGoalXp) * 100));
  const isAchieved = weeklyXp >= currentWeeklyGoalXp;

  return (
    <>
      {/* 週間目標カード */}
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-nunito text-sm font-bold text-[var(--muted-foreground)]">
            今週の目標
          </h2>
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg px-3 py-1 text-xs font-bold text-[#1cb0f6] hover:bg-[var(--background)]"
          >
            目標を変更
          </button>
        </div>
        <div className="mb-2 flex items-center justify-between">
          <span
            className={`text-sm font-bold ${isAchieved ? 'text-[#3fa800]' : 'text-[var(--foreground)]'}`}
          >
            {isAchieved ? '達成！🎉' : `${weeklyXp} / ${currentWeeklyGoalXp} XP`}
          </span>
          <span className="text-xs text-[var(--muted-foreground)]">{progressPercent}%</span>
        </div>
        <div
          className="h-3 w-full overflow-hidden rounded-full bg-[var(--background)]"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`週間目標達成率 ${progressPercent}%`}
        >
          <div
            className="h-full rounded-full bg-[#58cc02] transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* モーダル */}
      {open && (
        <div
          ref={backdropRef}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="goal-modal-title"
          onClick={handleBackdropClick}
          onKeyDown={handleKeyDown}
        >
          <div className="w-full max-w-sm rounded-t-3xl bg-white p-6 sm:rounded-3xl">
            <h3
              id="goal-modal-title"
              className="font-nunito mb-5 text-center text-lg font-extrabold text-[var(--foreground)]"
            >
              週間目標を設定する
            </h3>

            <div className="mb-6 flex flex-col gap-3">
              {WEEKLY_GOAL_OPTIONS.map((xp) => (
                <button
                  key={xp}
                  onClick={() => setSelected(xp)}
                  className={[
                    'flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all',
                    selected === xp
                      ? 'border-[#58cc02] bg-[#d7ffb8]'
                      : 'border-[var(--border)] bg-[var(--background)] hover:border-[#58cc02]',
                  ].join(' ')}
                >
                  <div
                    className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                      selected === xp ? 'border-[#58cc02] bg-[#58cc02]' : 'border-[var(--border)]'
                    }`}
                  >
                    {selected === xp && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                  <div>
                    <span className="font-nunito font-bold text-[var(--foreground)]">
                      {xp} XP / 週
                    </span>
                    <span className="ml-2 text-xs text-[var(--muted-foreground)]">
                      {xp === 50 ? '週2〜3回' : xp === 100 ? '週5回' : '毎日集中'}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <DuoButton
                variant="green"
                disabled={setGoalMutation.isPending}
                onClick={() => setGoalMutation.mutate({ weeklyGoalXp: selected })}
              >
                {setGoalMutation.isPending ? '保存中...' : '保存する'}
              </DuoButton>
              <button
                onClick={() => setOpen(false)}
                className="py-2 text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
