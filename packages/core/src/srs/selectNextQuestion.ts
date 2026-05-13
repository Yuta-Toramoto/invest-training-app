export type QuestionStats = {
  questionId: string;
  attemptCount: number;
  correctCount: number;
  lastIsCorrect: boolean | null;
};

export function selectNextQuestion(questionIds: string[], stats: QuestionStats[]): string {
  if (questionIds.length === 0) {
    throw new Error('questionIds must not be empty');
  }

  const statsMap = new Map(stats.map((s) => [s.questionId, s]));

  const unanswered: string[] = [];
  const incorrect: QuestionStats[] = [];
  const correct: QuestionStats[] = [];

  for (const id of questionIds) {
    const s = statsMap.get(id);
    if (!s || s.attemptCount === 0) {
      unanswered.push(id);
    } else if (s.lastIsCorrect === false) {
      incorrect.push(s);
    } else {
      correct.push(s);
    }
  }

  if (incorrect.length > 0) {
    incorrect.sort((a, b) => a.correctCount / a.attemptCount - b.correctCount / b.attemptCount);
    const first = incorrect[0];
    if (first) return first.questionId;
  }

  if (unanswered.length > 0) {
    const first = unanswered[0];
    if (first) return first;
  }

  correct.sort((a, b) => a.correctCount / a.attemptCount - b.correctCount / b.attemptCount);
  const first = correct[0];
  if (first) return first.questionId;

  throw new Error('No question could be selected');
}
