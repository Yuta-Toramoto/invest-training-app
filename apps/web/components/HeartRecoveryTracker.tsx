'use client';

import { useEffect } from 'react';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

export function HeartRecoveryTracker({ heartsBefore }: { heartsBefore: number }) {
  const { capture } = useAnalytics();

  useEffect(() => {
    capture({ name: 'heart_recovery_started', props: { hearts_before: heartsBefore } });
  }, [capture, heartsBefore]);

  return null;
}
