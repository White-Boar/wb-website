'use client';

/**
 * ThankYou Component
 *
 * Completion page for the onboarding flow.
 * Displays success message, timeline, and next steps.
 * Clears Zustand session metadata on mount.
 *
 * Visual Reference: context/Visual design/onboarding-13-thank-you.png
 * IMPORTANT: This component must match the design file 100%
 */

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useOnboardingStore, useHasActiveSession } from '@/lib/store/onboarding-store';
import { WhiteBoarLogo } from '@/components/WhiteBoarLogo';

export function ThankYou() {
  const t = useTranslations('onboarding.thankYou');
  const tNav = useTranslations('onboarding');
  const router = useRouter();
  const hasActiveSession = useHasActiveSession();
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

  const handleRestart = () => {
    resetSession();
    router.push('/onboarding');
  };

  return (
    <div className="min-h-screen bg-[var(--wb-background)] flex flex-col">
      {/* Navigation Header */}
      <header className="border-b border-[var(--wb-neutral-200)] bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <WhiteBoarLogo width={40} height={40} />
              <span className="text-xl font-bold text-[var(--wb-neutral-900)]">WhiteBoar</span>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-4">
              {/* Restart button */}
              {hasActiveSession && (
                <button
                  onClick={handleRestart}
                  className="flex items-center gap-2 text-sm text-[var(--wb-neutral-600)] hover:text-[var(--wb-neutral-900)] transition-colors"
                  aria-label={tNav('actions.restart')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Restart</span>
                </button>
              )}

              {/* Language selector */}
              <button
                className="p-2 text-[var(--wb-neutral-600)] hover:text-[var(--wb-neutral-900)] transition-colors"
                aria-label="Change language"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </button>

              {/* Theme toggle */}
              <button
                className="p-2 text-[var(--wb-neutral-600)] hover:text-[var(--wb-neutral-900)] transition-colors"
                aria-label="Toggle theme"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Success Icon */}
            <div className="text-center mb-8">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
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
              <p className="text-lg text-[var(--wb-neutral-600)] max-w-2xl mx-auto">{t('message')}</p>
            </div>

            {/* Timeline Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {/* Preview Ready - Blue icon */}
              <div className="p-6 rounded-lg bg-white border border-[var(--wb-neutral-200)] text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-blue-600"
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
                <h3 className="font-semibold mb-2 text-[var(--wb-neutral-900)]">
                  {t('timeline.title')}
                </h3>
                <p className="text-sm text-[var(--wb-neutral-600)]">{t('timeline.description')}</p>
              </div>

              {/* Email Notification - Purple icon */}
              <div className="p-6 rounded-lg bg-white border border-[var(--wb-neutral-200)] text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-purple-600"
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
                <h3 className="font-semibold mb-2 text-[var(--wb-neutral-900)]">
                  {t('notification.title')}
                </h3>
                <p className="text-sm text-[var(--wb-neutral-600)]">
                  {t('notification.description')}
                </p>
              </div>

              {/* Payment - Green star icon */}
              <div className="p-6 rounded-lg bg-white border border-[var(--wb-neutral-200)] text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2 text-[var(--wb-neutral-900)]">
                  {t('payment.title')}
                </h3>
                <p className="text-sm text-[var(--wb-neutral-600)]">{t('payment.description')}</p>
              </div>
            </div>

            {/* What happens next? - Beige background */}
            <div className="p-8 rounded-lg bg-[#F5F5DC] mb-8">
              <h2 className="text-xl font-bold mb-6 text-center text-[var(--wb-neutral-900)]">
                {t('nextSteps.title')}
              </h2>
              <ol className="space-y-4 max-w-2xl mx-auto">
                <li className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--wb-neutral-300)] text-[var(--wb-neutral-900)] text-sm flex items-center justify-center font-semibold">
                    1
                  </span>
                  <p className="text-[var(--wb-neutral-700)] pt-1">{t('nextSteps.step1')}</p>
                </li>
                <li className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--wb-neutral-300)] text-[var(--wb-neutral-900)] text-sm flex items-center justify-center font-semibold">
                    2
                  </span>
                  <p className="text-[var(--wb-neutral-700)] pt-1">{t('nextSteps.step2')}</p>
                </li>
                <li className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--wb-neutral-300)] text-[var(--wb-neutral-900)] text-sm flex items-center justify-center font-semibold">
                    3
                  </span>
                  <p className="text-[var(--wb-neutral-700)] pt-1">{t('nextSteps.step3')}</p>
                </li>
              </ol>

              {/* Back to Homepage Button - Yellow */}
              <div className="text-center mt-8">
                <button
                  onClick={handleBackHome}
                  className="px-8 py-3 bg-[var(--wb-accent)] text-black font-semibold rounded-lg hover:bg-[var(--wb-accent)]/90 transition-colors"
                >
                  {t('backHome')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--wb-neutral-200)] bg-white mt-auto">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-sm text-[var(--wb-neutral-600)]">
            <p>© 2025 WhiteBoar</p>
            <div className="flex items-center gap-2">
              <span>Secure & SSL Protected</span>
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
