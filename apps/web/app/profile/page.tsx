import { createClient } from '@/lib/supabase/server';
import { GoalSettingModal } from '@/components/GoalSettingModal';
import { getWeeklyXp } from '@invest-training/core';
import Link from 'next/link';

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, xp, current_streak, hearts, created_at, weekly_goal_xp')
    .single();

  const { data: attempts } = await supabase
    .from('attempts')
    .select('is_correct, answered_at, xp_earned')
    .order('answered_at', { ascending: false });

  const weeklyXp = getWeeklyXp({
    attempts: (attempts ?? []).map((a) => ({
      xpEarned: a.xp_earned,
      answeredAt: new Date(a.answered_at),
    })),
    now: new Date(),
    tzOffsetMinutes: -540,
  });

  const total = attempts?.length ?? 0;
  const correct = (attempts ?? []).filter((a) => a.is_correct).length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const dailyMap = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    dailyMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const a of attempts ?? []) {
    const day = a.answered_at.slice(0, 10);
    if (dailyMap.has(day) && a.is_correct) {
      dailyMap.set(day, (dailyMap.get(day) ?? 0) + 1);
    }
  }
  const recentActivity = Array.from(dailyMap.entries());
  const maxCount = Math.max(...recentActivity.map(([, c]) => c), 1);

  const displayName = profile?.display_name ?? 'ユーザー';
  const initial = displayName.slice(0, 1).toUpperCase();

  return (
    <div className="min-h-svh bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-white px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Link href="/" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            ← 戻る
          </Link>
          <span className="font-nunito font-bold text-[var(--foreground)]">プロフィール</span>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-5 px-4 py-6">
        {/* アバター & 名前 */}
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#58cc02] text-3xl font-bold text-white">
            {initial}
          </div>
          <h1 className="font-nunito text-xl font-extrabold text-[var(--foreground)]">
            {displayName}
          </h1>
          <div className="flex gap-6 text-center">
            <StatChip icon="⚡" label="XP" value={profile?.xp ?? 0} color="text-[#58cc02]" />
            <StatChip
              icon="🔥"
              label="ストリーク"
              value={profile?.current_streak ?? 0}
              color="text-[#ff9600]"
            />
            <StatChip
              icon="❤️"
              label="ハート"
              value={profile?.hearts ?? 5}
              color="text-[#ff4b4b]"
            />
          </div>
        </div>

        {/* 学習統計 */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-nunito mb-4 text-sm font-bold text-[var(--muted-foreground)]">
            学習統計
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-[var(--background)] p-4 text-center">
              <p className="font-nunito text-2xl font-extrabold text-[var(--foreground)]">
                {total}
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">回答数</p>
            </div>
            <div className="rounded-xl bg-[var(--background)] p-4 text-center">
              <p
                className={`font-nunito text-2xl font-extrabold ${accuracy >= 60 ? 'text-[#58cc02]' : 'text-[#ff4b4b]'}`}
              >
                {accuracy}%
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">正答率</p>
            </div>
          </div>
        </div>

        {/* 週間目標 */}
        <GoalSettingModal
          currentWeeklyGoalXp={profile?.weekly_goal_xp ?? 100}
          weeklyXp={weeklyXp}
        />

        {/* 直近7日のアクティビティ */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-nunito mb-4 text-sm font-bold text-[var(--muted-foreground)]">
            直近 7 日間の正解数
          </h2>
          <div className="flex items-end justify-between gap-1.5">
            {recentActivity.map(([date, count]) => {
              const heightPct = Math.round((count / maxCount) * 100);
              const dayLabel = new Date(date + 'T00:00:00').toLocaleDateString('ja-JP', {
                weekday: 'short',
              });
              return (
                <div key={date} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="flex w-full flex-col items-center justify-end"
                    style={{ height: '80px' }}
                  >
                    <div
                      className="w-full rounded-t-md bg-[#58cc02] transition-all duration-500"
                      style={{ height: `${Math.max(heightPct, 4)}%` }}
                    />
                  </div>
                  <span className="text-xs text-[var(--muted-foreground)]">{dayLabel}</span>
                  <span className="text-xs font-bold text-[var(--foreground)]">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatChip({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <span className={`font-nunito text-xl font-extrabold ${color}`}>
        {icon} {value}
      </span>
      <span className="text-xs text-[var(--muted-foreground)]">{label}</span>
    </div>
  );
}
