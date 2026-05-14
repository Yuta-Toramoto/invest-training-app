'use client';

import { DuoButton, HeartBar, ProgressBar } from '@invest-training/ui';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

type Question = {
  id: string;
  type: 'chart' | 'order_book' | 'volume';
  chartImageUrl: string | null;
  prompt: string;
  choices: { id: string; label: string }[];
  difficulty: number;
};

type SubmitResult = {
  isCorrect: boolean;
  correctChoiceId: string;
  explanation: string;
  xpGained: number;
  newTotalXp: number;
  goalAchievedThisWeek: boolean;
};

type Phase = 'question' | 'feedback' | 'complete';

type Props = {
  unitId: string;
  unitTitle: string;
  questions: Question[];
  initialXp: number;
  initialHearts: number;
};

export function LearnClient({
  unitId: _unitId,
  unitTitle: _unitTitle,
  questions,
  initialXp,
  initialHearts,
}: Props) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [phase, setPhase] = useState<Phase>('question');
  const [hearts, setHearts] = useState(initialHearts);
  const [xp, setXp] = useState(initialXp);
  const [startTime] = useState(() => Date.now());
  const [sessionStart] = useState(() => Date.now());
  const [correctCount, setCorrectCount] = useState(0);

  const submitMutation = trpc.question.submit.useMutation();
  const { capture } = useAnalytics();

  const currentQuestion = questions[idx];
  const isLast = idx === questions.length - 1;

  const fireConfetti = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#58cc02', '#ffc800', '#1cb0f6'],
    });
  }, []);

  const handleSelect = useCallback(
    (choiceId: string) => {
      if (phase !== 'question' || selected !== null) return;
      setSelected(choiceId);
    },
    [phase, selected],
  );

  const handleSubmit = useCallback(async () => {
    if (!selected || !currentQuestion) return;

    const timeTakenMs = Date.now() - startTime;
    try {
      const res = await submitMutation.mutateAsync({
        questionId: currentQuestion.id,
        selectedChoiceId: selected,
        timeTakenMs,
      });
      setResult(res);
      setXp(res.newTotalXp);
      if (!res.isCorrect) setHearts((h) => Math.max(0, h - 1));
      if (res.isCorrect) {
        setCorrectCount((c) => c + 1);
        fireConfetti();
      }
      if (res.goalAchievedThisWeek) {
        setTimeout(() => {
          confetti({
            particleCount: 200,
            spread: 120,
            origin: { y: 0.5 },
            colors: ['#58cc02', '#ffc800', '#1cb0f6', '#ff4b4b'],
          });
        }, 600);
        capture({ name: 'weekly_goal_achieved', props: { goal_xp: 0, weekly_xp: 0 } });
      }
      capture({
        name: 'question_answered',
        props: {
          is_correct: res.isCorrect,
          difficulty: currentQuestion.difficulty,
          xp_gained: res.xpGained,
        },
      });
      setPhase('feedback');
    } catch {
      // ネットワークエラー時は再試行可能な状態に戻す
      setSelected(null);
    }
  }, [selected, currentQuestion, startTime, submitMutation, fireConfetti, capture]);

  const handleNext = useCallback(() => {
    if (isLast) {
      const elapsed = Math.round((Date.now() - sessionStart) / 1000);
      capture({
        name: 'unit_completed',
        props: {
          accuracy_pct: Math.round((correctCount / questions.length) * 100),
          elapsed_sec: elapsed,
          question_count: questions.length,
        },
      });
      setPhase('complete');
    } else {
      setIdx((i) => i + 1);
      setSelected(null);
      setResult(null);
      setPhase('question');
    }
  }, [isLast, sessionStart, correctCount, questions.length, capture]);

  if (phase === 'complete') {
    const elapsed = Math.round((Date.now() - sessionStart) / 1000);
    const min = Math.floor(elapsed / 60)
      .toString()
      .padStart(2, '0');
    const sec = (elapsed % 60).toString().padStart(2, '0');
    const accuracy = Math.round((correctCount / questions.length) * 100);

    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-[var(--background)] px-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-sm space-y-6 text-center"
        >
          <div className="text-6xl">🎉</div>
          <h1 className="font-nunito text-3xl font-extrabold text-[var(--foreground)]">
            ユニット完了！
          </h1>
          <div className="space-y-3 rounded-2xl bg-white p-6 shadow-sm">
            <Stat label="獲得 XP" value={`+${xp - initialXp}`} color="text-[#58cc02]" />
            <Stat
              label="正答率"
              value={`${accuracy}%`}
              color={accuracy >= 80 ? 'text-[#58cc02]' : 'text-[#ff4b4b]'}
            />
            <Stat label="所要時間" value={`${min}:${sec}`} color="text-[#1cb0f6]" />
          </div>
          <DuoButton variant="green" onClick={() => router.push('/')}>
            ホームに戻る
          </DuoButton>
        </motion.div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="flex min-h-svh flex-col bg-[var(--background)]">
      {/* HUD */}
      <header className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => router.push('/')}
          className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--muted-foreground)] hover:bg-white"
          aria-label="終了"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M4 4L16 16M16 4L4 16"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <div className="flex-1">
          <ProgressBar current={idx} total={questions.length} />
        </div>
        <HeartBar hearts={hearts} />
      </header>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.main
          key={idx}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.2 }}
          className="flex flex-1 flex-col px-4 pb-4"
        >
          {/* Chart / image area */}
          <div className="relative mb-4 overflow-hidden rounded-2xl bg-white shadow-sm">
            {currentQuestion.chartImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentQuestion.chartImageUrl}
                alt="チャート"
                className="h-52 w-full object-cover"
              />
            ) : (
              <div className="flex h-52 items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                <span className="font-nunito text-4xl">📈</span>
              </div>
            )}
          </div>

          {/* Prompt */}
          <p className="font-nunito mb-6 text-lg font-bold text-[var(--foreground)]">
            {currentQuestion.prompt}
          </p>

          {/* Choices */}
          <div className="flex flex-col gap-3">
            {currentQuestion.choices.map((choice) => {
              const isSelected = selected === choice.id;
              const showFeedback = phase === 'feedback' && result !== null;
              const isCorrectChoice = showFeedback && choice.id === result.correctChoiceId;
              const isWrongSelected = showFeedback && isSelected && !result.isCorrect;

              let variant: 'green' | 'red' | 'gray' = 'gray';
              if (isCorrectChoice) variant = 'green';
              else if (isWrongSelected) variant = 'red';

              return (
                <DuoButton
                  key={choice.id}
                  variant={variant}
                  selected={isSelected || isCorrectChoice}
                  disabled={phase === 'feedback' || submitMutation.isPending}
                  onClick={() => handleSelect(choice.id)}
                >
                  {choice.label}
                </DuoButton>
              );
            })}
          </div>

          {/* Submit / Next button */}
          <div className="mt-4">
            {phase === 'question' ? (
              <DuoButton
                variant="green"
                disabled={!selected || submitMutation.isPending}
                onClick={handleSubmit}
              >
                {submitMutation.isPending ? '送信中...' : '回答する'}
              </DuoButton>
            ) : null}
          </div>
        </motion.main>
      </AnimatePresence>

      {/* Feedback sheet */}
      <AnimatePresence>
        {phase === 'feedback' && result !== null && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`px-4 pb-8 pt-5 ${result.isCorrect ? 'bg-[#d7ffb8]' : 'bg-[#ffdfe0]'}`}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="text-2xl">{result.isCorrect ? '✅' : '❌'}</span>
              <span
                className={`font-nunito text-lg font-extrabold ${result.isCorrect ? 'text-[#3fa800]' : 'text-[#cc0000]'}`}
              >
                {result.isCorrect ? `すばらしい！ +${result.xpGained} XP` : '残念！'}
              </span>
            </div>
            {!result.isCorrect && (
              <p className="mb-3 text-sm text-[var(--foreground)]">
                <span className="font-bold">解説: </span>
                {result.explanation}
              </p>
            )}
            <DuoButton variant={result.isCorrect ? 'green' : 'red'} onClick={handleNext}>
              {isLast ? '結果を見る' : '次へ'}
            </DuoButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[var(--muted-foreground)]">{label}</span>
      <span className={`font-nunito text-xl font-extrabold ${color}`}>{value}</span>
    </div>
  );
}
