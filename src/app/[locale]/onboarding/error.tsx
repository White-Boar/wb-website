'use client';

import { useEffect } from 'react';

export default function OnboardingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Onboarding error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-[var(--wb-error)]">Something went wrong!</h2>
        <p className="mb-6 text-[var(--wb-neutral-600)]">
          We encountered an error while loading your onboarding. Please try again.
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-[var(--wb-primary)] text-white rounded-lg hover:bg-[var(--wb-primary-hover)] transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
