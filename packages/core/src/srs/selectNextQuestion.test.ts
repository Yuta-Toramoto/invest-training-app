import { describe, expect, it } from 'vitest';
import { selectNextQuestion } from './selectNextQuestion';
import type { QuestionStats } from './selectNextQuestion';

describe('selectNextQuestion', () => {
  const ids = ['q1', 'q2', 'q3'];

  describe('未回答優先', () => {
    it('全て未回答 → 最初の問題を返す', () => {
      const result = selectNextQuestion(ids, []);
      expect(ids).toContain(result);
    });

    it('一部未回答 → 未回答を優先', () => {
      const stats: QuestionStats[] = [
        { questionId: 'q1', attemptCount: 1, correctCount: 1, lastIsCorrect: true },
        { questionId: 'q2', attemptCount: 1, correctCount: 1, lastIsCorrect: true },
      ];
      expect(selectNextQuestion(ids, stats)).toBe('q3');
    });
  });

  describe('不正解優先', () => {
    it('不正解の問題を未回答より優先', () => {
      const stats: QuestionStats[] = [
        { questionId: 'q1', attemptCount: 2, correctCount: 1, lastIsCorrect: false },
      ];
      expect(selectNextQuestion(ids, stats)).toBe('q1');
    });

    it('複数不正解がある場合は正答率が低い方を優先', () => {
      const stats: QuestionStats[] = [
        { questionId: 'q1', attemptCount: 4, correctCount: 2, lastIsCorrect: false }, // 50%
        { questionId: 'q2', attemptCount: 4, correctCount: 1, lastIsCorrect: false }, // 25%
        { questionId: 'q3', attemptCount: 1, correctCount: 1, lastIsCorrect: true },
      ];
      expect(selectNextQuestion(ids, stats)).toBe('q2');
    });
  });

  describe('正解済みの選択', () => {
    it('全て正解済み → 正答率が低い順', () => {
      const stats: QuestionStats[] = [
        { questionId: 'q1', attemptCount: 2, correctCount: 2, lastIsCorrect: true }, // 100%
        { questionId: 'q2', attemptCount: 4, correctCount: 2, lastIsCorrect: true }, // 50%
        { questionId: 'q3', attemptCount: 3, correctCount: 2, lastIsCorrect: true }, // 67%
      ];
      expect(selectNextQuestion(ids, stats)).toBe('q2');
    });
  });

  describe('エッジケース', () => {
    it('questionIds が空 → エラー', () => {
      expect(() => selectNextQuestion([], [])).toThrow();
    });

    it('stats に questionIds にない id が含まれても無視', () => {
      const stats: QuestionStats[] = [
        { questionId: 'unknown', attemptCount: 1, correctCount: 0, lastIsCorrect: false },
      ];
      expect(ids).toContain(selectNextQuestion(ids, stats));
    });
  });
});
