'use client';

import { usePostHog } from 'posthog-js/react';
import { useCallback } from 'react';

type AnalyticsEvent =
  | {
      name: 'question_answered';
      props: { is_correct: boolean; difficulty: number; xp_gained: number };
    }
  | {
      name: 'unit_completed';
      props: { accuracy_pct: number; elapsed_sec: number; question_count: number };
    }
  | { name: 'weekly_goal_achieved'; props: { goal_xp: number; weekly_xp: number } }
  | { name: 'goal_setting_changed'; props: { from_xp: number; to_xp: number } }
  | { name: 'heart_recovery_started'; props: { hearts_before: number } }
  | { name: 'review_correct'; props: Record<string, never> };

export function useAnalytics() {
  const ph = usePostHog();

  const capture = useCallback(
    (event: AnalyticsEvent) => {
      ph?.capture(event.name, event.props);
    },
    [ph],
  );

  return { capture };
}
