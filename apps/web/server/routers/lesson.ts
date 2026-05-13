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

  listWithProgress: protectedProcedure.query(async ({ ctx }) => {
    const { data: lessons } = await ctx.supabase
      .from('lessons')
      .select('id, title, order, difficulty, units(id, title, order)')
      .order('order');

    if (!lessons) return [];

    const allUnitIds = lessons.flatMap((l) =>
      ((l.units as { id: string }[]) ?? []).map((u) => u.id),
    );

    const { data: questionCounts } = await ctx.supabase
      .from('questions')
      .select('unit_id, id')
      .in('unit_id', allUnitIds.length > 0 ? allUnitIds : ['00000000-0000-0000-0000-000000000000']);

    const { data: userAttempts } = await ctx.supabase
      .from('attempts')
      .select('question_id')
      .eq('user_id', ctx.user.id);

    const answeredQuestionIds = new Set((userAttempts ?? []).map((a) => a.question_id));

    const questionsByUnit = new Map<string, string[]>();
    for (const q of questionCounts ?? []) {
      const list = questionsByUnit.get(q.unit_id) ?? [];
      list.push(q.id);
      questionsByUnit.set(q.unit_id, list);
    }

    return lessons.map((lesson) => {
      const units = ((lesson.units as { id: string; title: string; order: number }[]) ?? [])
        .sort((a, b) => a.order - b.order)
        .map((unit) => {
          const questionIds = questionsByUnit.get(unit.id) ?? [];
          const answeredCount = questionIds.filter((qid) => answeredQuestionIds.has(qid)).length;
          return {
            unitId: unit.id,
            title: unit.title,
            order: unit.order,
            totalQuestions: questionIds.length,
            answeredQuestions: answeredCount,
            completed: questionIds.length > 0 && answeredCount >= questionIds.length,
          };
        });

      return {
        id: lesson.id,
        title: lesson.title,
        order: lesson.order,
        difficulty: lesson.difficulty,
        units,
      };
    });
  }),
});
