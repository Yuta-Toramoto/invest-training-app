import { protectedProcedure, router } from '../trpc';

export const lessonRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from('lessons')
      .select('id, slug, title, description, order, difficulty')
      .order('order');

    if (error) return [];

    return (data ?? []).map((l) => ({
      id: l.id,
      slug: l.slug,
      title: l.title,
      description: l.description,
      order: l.order,
      difficulty: l.difficulty,
    }));
  }),
});
