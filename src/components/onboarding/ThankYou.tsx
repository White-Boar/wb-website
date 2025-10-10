'use client';

/**
 * ThankYou Component
 *
 * Completion page for the onboarding flow.
 * Displays success message, timeline, and next steps.
 * Clears Zustand session metadata on mount.
 *
 * Visual Reference: context/Visual design/onboarding-13-thank-you.png
 */

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useOnboardingStore } from '@/lib/store/onboarding-store';

export function ThankYou() {
  const t = useTranslations('onboarding.thankYou');
  const router = useRouter();
  const { resetSession } = useOnboardingStore();

  // Clear session metadata on mount
  useEffect(() => {
    // For foundation sprint: Simply clear the session
    // Future sprints: Will keep session for tracking purposes
    resetSession();
  }, [resetSession]);

  const handleBackHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[var(--wb-background)] flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-[var(--wb-neutral-900)]">
            {t('title')}
          </h1>
          <p className="text-lg text-[var(--wb-neutral-600)] max-w-xl mx-auto">{t('message')}</p>
        </div>

        {/* Timeline Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Preview Ready */}
          <div className="p-6 rounded-lg bg-white border border-[var(--wb-neutral-200)] text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--wb-accent)]/10 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-[var(--wb-accent)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="font-semibold mb-1 text-[var(--wb-neutral-900)]">
              {t('timeline.title')}
            </h3>
            <p className="text-sm text-[var(--wb-neutral-600)]">{t('timeline.description')}</p>
          </div>

          {/* Email Notification */}
          <div className="p-6 rounded-lg bg-white border border-[var(--wb-neutral-200)] text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--wb-accent)]/10 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-[var(--wb-accent)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="font-semibold mb-1 text-[var(--wb-neutral-900)]">
              {t('notification.title')}
            </h3>
            <p className="text-sm text-[var(--wb-neutral-600)]">
              {t('notification.description')}
            </p>
          </div>

          {/* Payment */}
          <div className="p-6 rounded-lg bg-white border border-[var(--wb-neutral-200)] text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--wb-accent)]/10 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-[var(--wb-accent)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="font-semibold mb-1 text-[var(--wb-neutral-900)]">
              {t('payment.title')}
            </h3>
            <p className="text-sm text-[var(--wb-neutral-600)]">{t('payment.description')}</p>
          </div>
        </div>

        {/* Next Steps */}
        <div className="p-6 rounded-lg bg-white border border-[var(--wb-neutral-200)] mb-8">
          <h2 className="text-xl font-bold mb-4 text-[var(--wb-neutral-900)]">
            {t('nextSteps.title')}
          </h2>
          <ol className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--wb-accent)] text-white text-sm flex items-center justify-center font-semibold">
                1
              </span>
              <p className="text-[var(--wb-neutral-700)]">{t('nextSteps.step1')}</p>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--wb-accent)] text-white text-sm flex items-center justify-center font-semibold">
                2
              </span>
              <p className="text-[var(--wb-neutral-700)]">{t('nextSteps.step2')}</p>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--wb-accent)] text-white text-sm flex items-center justify-center font-semibold">
                3
              </span>
              <p className="text-[var(--wb-neutral-700)]">{t('nextSteps.step3')}</p>
            </li>
          </ol>
        </div>

        {/* Back to Homepage Button */}
        <div className="text-center">
          <button
            onClick={handleBackHome}
            className="px-8 py-3 text-white bg-[var(--wb-primary)] rounded-lg hover:bg-[var(--wb-primary-hover)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--wb-accent)]"
          >
            {t('backHome')}
          </button>
        </div>
      </div>
    </div>
  );
}
