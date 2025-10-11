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
import { motion } from 'framer-motion';
import { useOnboardingStore, useHasActiveSession } from '@/lib/store/onboarding-store';
import { WhiteBoarLogo } from '@/components/WhiteBoarLogo';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ThemeToggle } from '@/components/ThemeToggle';

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Navigation Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <WhiteBoarLogo width={80} height={80} />
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">WhiteBoar</span>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-4">
              {/* Restart button */}
              {hasActiveSession && (
                <button
                  onClick={handleRestart}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  aria-label={tNav('actions.restart')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Restart</span>
                </button>
              )}

              {/* Language selector */}
              <LanguageSelector />

              {/* Theme toggle */}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Success Icon */}
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                {t('title')}
              </h1>
              <p className="text-base text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">{t('message')}</p>
            </motion.div>

            {/* Timeline Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {/* Preview Ready - Blue icon */}
              <motion.div
                className="p-6 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-center shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <svg
                    className="w-7 h-7 text-blue-600 dark:text-blue-400"
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
                <h3 className="font-semibold text-base mb-1 text-gray-900 dark:text-gray-100">
                  {t('timeline.title')}
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">{t('timeline.description')}</p>
              </motion.div>

              {/* Email Notification - Purple icon */}
              <motion.div
                className="p-6 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-center shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <svg
                    className="w-7 h-7 text-purple-600 dark:text-purple-400"
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
                <h3 className="font-semibold text-base mb-1 text-gray-900 dark:text-gray-100">
                  {t('notification.title')}
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {t('notification.description')}
                </p>
              </motion.div>

              {/* Payment - Green star icon */}
              <motion.div
                className="p-6 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-center shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <svg
                    className="w-7 h-7 text-green-600 dark:text-green-400"
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
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  {t('payment.title')}
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">{t('payment.description')}</p>
              </motion.div>
            </div>

            {/* What happens next? - Gradient background */}
            <motion.div
              className="px-10 py-6 rounded-lg bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h2 className="text-xl font-bold mb-4 text-center text-gray-900 dark:text-gray-100">
                {t('nextSteps.title')}
              </h2>
              <ol className="space-y-3 max-w-2xl mx-auto">
                <li className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-base flex items-center justify-center font-semibold">
                    1
                  </span>
                  <p className="text-gray-700 dark:text-gray-300 pt-2 leading-snug">{t('nextSteps.step1')}</p>
                </li>
                <li className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-base flex items-center justify-center font-semibold">
                    2
                  </span>
                  <p className="text-gray-700 dark:text-gray-300 pt-2 leading-snug">{t('nextSteps.step2')}</p>
                </li>
                <li className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-base flex items-center justify-center font-semibold">
                    3
                  </span>
                  <p className="text-gray-700 dark:text-gray-300 pt-2 leading-snug">{t('nextSteps.step3')}</p>
                </li>
              </ol>

              {/* Back to Homepage Button - Yellow */}
              <div className="text-center mt-8">
                <button
                  onClick={handleBackHome}
                  className="px-8 py-3 bg-[rgb(255_212_0)] text-black font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  {t('backHome')}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 mt-auto">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
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
