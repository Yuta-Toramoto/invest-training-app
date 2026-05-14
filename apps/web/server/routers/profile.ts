import { getWeeklyXp } from '@invest-training/core';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';

export const profileRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from('profiles')
      .select('id, display_name, xp, current_streak, hearts, weekly_goal_xp')
      .eq('id', ctx.user.id)
      .single();

    if (error || !data) return null;

    const { data: weekAttempts } = await ctx.supabase
      .from('attempts')
      .select('xp_earned, answered_at')
      .eq('user_id', ctx.user.id);

    const weeklyXp = getWeeklyXp({
      attempts: (weekAttempts ?? []).map((a) => ({
        xpEarned: a.xp_earned,
        answeredAt: new Date(a.answered_at),
      })),
      now: new Date(),
      tzOffsetMinutes: -540,
    });

    return {
      id: data.id,
      displayName: data.display_name,
      xp: data.xp,
      currentStreak: data.current_streak,
      hearts: data.hearts,
      weeklyGoalXp: data.weekly_goal_xp,
      weeklyXp,
    };
  }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const { data: profile } = await ctx.supabase
      .from('profiles')
      .select('display_name, xp, current_streak, hearts, created_at')
      .eq('id', ctx.user.id)
      .single();

    const { data: attempts } = await ctx.supabase
      .from('attempts')
      .select('is_correct, answered_at')
      .eq('user_id', ctx.user.id)
      .order('answered_at', { ascending: false });

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
    const recentActivity = Array.from(dailyMap.entries()).map(([date, count]) => ({ date, count }));

    return {
      displayName: profile?.display_name ?? '',
      xp: profile?.xp ?? 0,
      currentStreak: profile?.current_streak ?? 0,
      hearts: profile?.hearts ?? 5,
      totalAnswered: total,
      accuracy,
      recentActivity,
    };
  }),

  setGoal: protectedProcedure
    .input(
      z.object({
        weeklyGoalXp: z.union([z.literal(50), z.literal(100), z.literal(250)]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.supabase
        .from('profiles')
        .update({ weekly_goal_xp: input.weeklyGoalXp })
        .eq('id', ctx.user.id);
    }),

  leaderboard: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase.rpc('get_weekly_leaderboard');

    if (error || !data) return [];

    return (
      data as { user_id: string; display_name: string; weekly_xp: number; rank: number }[]
    ).map((row) => ({
      userId: row.user_id,
      displayName: row.display_name,
      weeklyXp: row.weekly_xp,
      rank: row.rank,
      isMe: row.user_id === ctx.user.id,
    }));
  }),
});
