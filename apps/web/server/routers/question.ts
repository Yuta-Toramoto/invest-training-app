import { calculateXp, getWeeklyXp, selectNextQuestion, updateStreak } from '@invest-training/core';
import type { QuestionStats } from '@invest-training/core';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';

export const questionRouter = router({
  getNext: protectedProcedure
    .input(z.object({ unitId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data: questions, error } = await ctx.supabase
        .from('questions')
        .select('id, type, chart_image_url, order_book_image_url, prompt, choices, difficulty')
        .eq('unit_id', input.unitId);

      if (error || !questions || questions.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'No questions found for this unit' });
      }

      const questionIds = questions.map((q) => q.id);

      const { data: attempts } = await ctx.supabase
        .from('attempts')
        .select('question_id, is_correct')
        .eq('user_id', ctx.user.id)
        .in('question_id', questionIds);

      const statsMap = new Map<
        string,
        { attemptCount: number; correctCount: number; lastIsCorrect: boolean | null }
      >();
      for (const a of attempts ?? []) {
        const prev = statsMap.get(a.question_id);
        if (!prev) {
          statsMap.set(a.question_id, {
            attemptCount: 1,
            correctCount: a.is_correct ? 1 : 0,
            lastIsCorrect: a.is_correct,
          });
        } else {
          prev.attemptCount += 1;
          if (a.is_correct) prev.correctCount += 1;
          prev.lastIsCorrect = a.is_correct;
        }
      }

      const stats: QuestionStats[] = questionIds.map((id) => {
        const s = statsMap.get(id);
        return {
          questionId: id,
          attemptCount: s?.attemptCount ?? 0,
          correctCount: s?.correctCount ?? 0,
          lastIsCorrect: s?.lastIsCorrect ?? null,
        };
      });

      const nextId = selectNextQuestion(questionIds, stats);
      const q = questions.find((x) => x.id === nextId)!;

      return {
        id: q.id,
        type: q.type as 'chart' | 'order_book' | 'volume',
        chartImageUrl: q.chart_image_url,
        orderBookImageUrl: q.order_book_image_url,
        prompt: q.prompt,
        choices: q.choices as { id: string; label: string }[],
        difficulty: q.difficulty,
      };
    }),

  submit: protectedProcedure
    .input(
      z.object({
        questionId: z.string().uuid(),
        selectedChoiceId: z.string(),
        timeTakenMs: z.number().int().nonnegative(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { data: question, error } = await ctx.supabase
        .from('questions')
        .select('correct_choice_id, explanation, difficulty')
        .eq('id', input.questionId)
        .single();

      if (error || !question) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Question not found' });
      }

      const isCorrect = input.selectedChoiceId === question.correct_choice_id;

      const xpResult = calculateXp({
        isCorrect,
        difficulty: question.difficulty,
        timeTakenMs: input.timeTakenMs,
      });

      const { data: profile } = await ctx.supabase
        .from('profiles')
        .select('xp, current_streak, hearts, last_active_at, weekly_goal_xp')
        .eq('id', ctx.user.id)
        .single();

      const { data: thisWeekAttempts } = await ctx.supabase
        .from('attempts')
        .select('xp_earned, answered_at')
        .eq('user_id', ctx.user.id);

      const now = new Date();
      const tzOffsetMinutes = -540;

      const weeklyXpBefore = getWeeklyXp({
        attempts: (thisWeekAttempts ?? []).map((a) => ({
          xpEarned: a.xp_earned,
          answeredAt: new Date(a.answered_at),
        })),
        now,
        tzOffsetMinutes,
      });

      await ctx.supabase.from('attempts').insert({
        user_id: ctx.user.id,
        question_id: input.questionId,
        selected_choice_id: input.selectedChoiceId,
        is_correct: isCorrect,
        xp_earned: xpResult.total,
        time_taken_ms: input.timeTakenMs,
      });

      const currentXp = profile?.xp ?? 0;
      const newTotalXp = currentXp + xpResult.total;

      const streakResult = updateStreak({
        currentStreak: profile?.current_streak ?? 0,
        lastActiveAt: profile?.last_active_at ? new Date(profile.last_active_at) : null,
        now,
        tzOffsetMinutes,
      });

      const currentHearts = profile?.hearts ?? 5;
      const newHearts = isCorrect ? currentHearts : Math.max(0, currentHearts - 1);

      await ctx.supabase
        .from('profiles')
        .update({
          xp: newTotalXp,
          current_streak: streakResult.newStreak,
          hearts: newHearts,
          last_active_at: now.toISOString(),
        })
        .eq('id', ctx.user.id);

      const weeklyGoalXp = profile?.weekly_goal_xp ?? 100;
      const weeklyXpAfter = weeklyXpBefore + xpResult.total;
      const goalAchievedThisWeek = weeklyXpBefore < weeklyGoalXp && weeklyXpAfter >= weeklyGoalXp;

      return {
        isCorrect,
        correctChoiceId: question.correct_choice_id,
        explanation: question.explanation,
        xpGained: xpResult.total,
        newTotalXp,
        streakResult,
        goalAchievedThisWeek,
      };
    }),

  getReview: protectedProcedure.query(async ({ ctx }) => {
    const { data: incorrectAttempts } = await ctx.supabase
      .from('attempts')
      .select('question_id')
      .eq('user_id', ctx.user.id)
      .eq('is_correct', false)
      .order('answered_at', { ascending: false })
      .limit(20);

    if (!incorrectAttempts || incorrectAttempts.length === 0) return null;

    const candidateIds = [...new Set(incorrectAttempts.map((a) => a.question_id))];
    const randomId = candidateIds[Math.floor(Math.random() * candidateIds.length)];
    if (!randomId) return null;

    const { data: question } = await ctx.supabase
      .from('questions')
      .select('id, type, chart_image_url, prompt, choices, difficulty')
      .eq('id', randomId)
      .single();

    if (!question) return null;

    return {
      id: question.id,
      type: question.type as 'chart' | 'order_book' | 'volume',
      chartImageUrl: question.chart_image_url,
      prompt: question.prompt,
      choices: question.choices as { id: string; label: string }[],
      difficulty: question.difficulty,
    };
  }),
});
