import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

const LEAGUE = (rank: number) => {
  if (rank <= 3) return { label: 'Gold', icon: '🥇', color: 'text-[#ffc800]' };
  if (rank <= 10) return { label: 'Silver', icon: '🥈', color: 'text-[#aaaaaa]' };
  return { label: 'Bronze', icon: '🥉', color: 'text-[#cd7f32]' };
};

export default async function LeaderboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  type LeaderboardRow = { user_id: string; display_name: string; weekly_xp: number; rank: number };
  const { data } = (await supabase.rpc('get_weekly_leaderboard')) as {
    data: LeaderboardRow[] | null;
  };
  const rows = data ?? [];

  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  const resetDate = new Date(now);
  resetDate.setDate(now.getDate() + daysUntilSunday);

  return (
    <div className="min-h-svh bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-white px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Link href="/" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            ← 戻る
          </Link>
          <span className="font-nunito font-bold text-[var(--foreground)]">週次ランキング</span>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6">
        <div className="mb-4 rounded-xl border border-[var(--border)] bg-white p-4 text-center">
          <p className="text-xs text-[var(--muted-foreground)]">
            リセット: {resetDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}{' '}
            日曜 23:59
          </p>
          <p className="font-nunito mt-1 text-sm font-bold text-[var(--foreground)]">
            今週の正解数 × 10 XP で順位が決まります
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
          {rows.length === 0 ? (
            <div className="py-12 text-center text-[var(--muted-foreground)]">
              <p className="text-3xl">🏆</p>
              <p className="mt-2 text-sm">今週はまだ回答がありません</p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {rows.map((row) => {
                const league = LEAGUE(row.rank);
                const isMe = row.user_id === user?.id;
                return (
                  <li
                    key={row.user_id}
                    className={`flex items-center gap-4 px-4 py-4 ${isMe ? 'bg-[#f0fff4]' : ''}`}
                  >
                    <span className={`w-8 text-center text-lg font-extrabold ${league.color}`}>
                      {row.rank <= 3 ? league.icon : `${row.rank}`}
                    </span>
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#58cc02] text-sm font-bold text-white">
                      {row.display_name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`font-nunito truncate font-bold ${isMe ? 'text-[#3fa800]' : 'text-[var(--foreground)]'}`}
                      >
                        {row.display_name} {isMe && <span className="text-xs">（あなた）</span>}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">{league.label}</p>
                    </div>
                    <span className="font-nunito font-extrabold text-[#58cc02]">
                      {row.weekly_xp} XP
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
