import { protectedProcedure, router } from '../trpc';

export const profileRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from('profiles')
      .select('id, display_name, xp, current_streak, hearts')
      .eq('id', ctx.user.id)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      displayName: data.display_name,
      xp: data.xp,
      currentStreak: data.current_streak,
      hearts: data.hearts,
    };
  }),
});
