'use client';

/**
 * Welcome Component
 *
 * Landing page for the onboarding flow.
 * Displays value proposition, process overview, and "Start Your Website" CTA.
 * Includes restart functionality for returning users.
 *
 * Visual Reference: context/Visual design/onboarding-00-welcome.png
 * IMPORTANT: This component must match the design file 100%
 */

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useOnboardingStore, useHasActiveSession } from '@/lib/store/onboarding-store';
import { WhiteBoarLogo } from '@/components/WhiteBoarLogo';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ThemeToggle } from '@/components/ThemeToggle';

export function Welcome() {
  const t = useTranslations('onboarding.welcome');
  const router = useRouter();
  const hasActiveSession = useHasActiveSession();
  const { resetSession, setCurrentStep } = useOnboardingStore();

  const handleStart = () => {
    // For foundation sprint: Start fresh session and navigate to thank you
    setCurrentStep(1);
    router.push('/onboarding/thank-you');
  };

  const handleRestart = () => {
    resetSession();
    setCurrentStep(1);
    router.refresh();
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
                  aria-label={t('actions.restart')}
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
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                {t('title')}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                {t('subtitle')}
              </p>
            </motion.div>

            {/* Value Proposition Cards - 3 in a row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {/* Lightning Fast */}
              <motion.div
                className="text-center p-6 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-12 h-12 text-[rgb(255_212_0)]" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" opacity="0.2" />
                    <path d="M13 2L3 14h8l-2 8 10-12h-8l2-8z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  {t('features.fast.title')}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('features.fast.description')}
                </p>
              </motion.div>

              {/* Secure & Reliable */}
              <motion.div
                className="text-center p-6 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-12 h-12 text-[rgb(255_212_0)]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" opacity="0.9" />
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  {t('features.secure.title')}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('features.secure.description')}
                </p>
              </motion.div>

              {/* AI-Powered */}
              <motion.div
                className="text-center p-6 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-12 h-12 text-[rgb(255_212_0)]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" />
                    <path d="M6 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" opacity="0.6" />
                    <path d="M18 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" opacity="0.6" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  {t('features.smart.title')}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('features.smart.description')}
                </p>
              </motion.div>
            </div>

            {/* How It Works - Connected circles */}
            <motion.div
              className="mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h2 className="text-2xl font-bold mb-8 text-center text-gray-900 dark:text-gray-100">
                {t('process.title')}
              </h2>
              <div className="relative">
                {/* Connection line */}
                <div className="hidden md:block absolute top-6 h-0.5 bg-gray-300 dark:bg-gray-700" style={{ left: '12.5%', right: '12.5%' }} />

                {/* Steps */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                  {['1', '2', '3', '4'].map((step) => (
                    <div key={step} className="text-center">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 flex items-center justify-center font-bold text-lg relative z-10">
                        {step}
                      </div>
                      <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
                        {t(`process.steps.${step}.title`)}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t(`process.steps.${step}.description`)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* What You'll Need */}
            <motion.div
              className="mb-12 p-8 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <h2 className="text-2xl font-bold mb-8 text-center text-gray-900 dark:text-gray-100">
                {t('requirements.title')}
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                {/* Business Information */}
                <div>
                  <h3 className="font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    {t('requirements.business.title')}
                  </h3>
                  <ul className="space-y-3">
                    {['name', 'email', 'address', 'phone'].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {t(`requirements.business.${item}`)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Optional Assets */}
                <div>
                  <h3 className="font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    {t('requirements.assets.title')}
                  </h3>
                  <ul className="space-y-3">
                    {['logo', 'photos', 'examples', 'content'].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {t(`requirements.assets.${item}`)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* CTA Section */}
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <button
                onClick={handleStart}
                className="px-8 py-4 bg-[rgb(255_212_0)] text-black font-semibold rounded-lg hover:opacity-90 transition-opacity inline-flex items-center gap-2"
              >
                <span>{t('actions.start')}</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">{t('disclaimer')}</p>
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
