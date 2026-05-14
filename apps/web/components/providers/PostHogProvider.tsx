'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';

if (typeof window !== 'undefined' && process.env['NEXT_PUBLIC_POSTHOG_KEY']) {
  posthog.init(process.env['NEXT_PUBLIC_POSTHOG_KEY'], {
    api_host: process.env['NEXT_PUBLIC_POSTHOG_HOST'] ?? 'https://us.i.posthog.com',
    capture_pageview: false,
    person_profiles: 'identified_only',
  });
}

function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    ph?.capture('$pageview', { $current_url: window.location.href });
  }, [pathname, searchParams, ph]);

  return null;
}

function UserIdentifier() {
  const ph = usePostHog();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      const userId = data.session?.user?.id;
      if (userId) {
        ph?.identify(userId);
      }
    });
  }, [ph]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
      <UserIdentifier />
      {children}
    </PHProvider>
  );
}
