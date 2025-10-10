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
import { useOnboardingStore, useHasActiveSession } from '@/lib/store/onboarding-store';
import { WhiteBoarLogo } from '@/components/WhiteBoarLogo';

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
                  aria-label={t('actions.restart')}
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
          <div className="max-w-5xl mx-auto">
            {/* Header with magic wand */}
            <div className="text-center mb-12 relative">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[var(--wb-neutral-900)] inline-block">
                {t('title')}
              </h1>
              {/* Magic wand icon */}
              <svg
                className="w-12 h-12 text-[var(--wb-neutral-300)] absolute top-0 right-0 md:right-1/4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <p className="text-lg text-[var(--wb-neutral-600)] max-w-2xl mx-auto">
                {t('subtitle')}
              </p>
            </div>

            {/* Value Proposition Cards - 3 in a row */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {/* Lightning Fast */}
              <div className="text-center p-6 rounded-lg bg-white border border-[var(--wb-neutral-200)]">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--wb-accent)]/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-[var(--wb-accent)]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold mb-2 text-[var(--wb-neutral-900)]">
                  {t('features.fast.title')}
                </h2>
                <p className="text-sm text-[var(--wb-neutral-600)]">
                  {t('features.fast.description')}
                </p>
              </div>

              {/* Secure & Reliable */}
              <div className="text-center p-6 rounded-lg bg-white border border-[var(--wb-neutral-200)]">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--wb-accent)]/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-[var(--wb-accent)]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold mb-2 text-[var(--wb-neutral-900)]">
                  {t('features.secure.title')}
                </h2>
                <p className="text-sm text-[var(--wb-neutral-600)]">
                  {t('features.secure.description')}
                </p>
              </div>

              {/* AI-Powered */}
              <div className="text-center p-6 rounded-lg bg-white border border-[var(--wb-neutral-200)]">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--wb-accent)]/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-[var(--wb-accent)]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold mb-2 text-[var(--wb-neutral-900)]">
                  {t('features.smart.title')}
                </h2>
                <p className="text-sm text-[var(--wb-neutral-600)]">
                  {t('features.smart.description')}
                </p>
              </div>
            </div>

            {/* How It Works - Connected circles */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-8 text-center text-[var(--wb-neutral-900)]">
                {t('process.title')}
              </h2>
              <div className="relative">
                {/* Connection line */}
                <div className="hidden md:block absolute top-5 left-0 right-0 h-0.5 bg-[var(--wb-neutral-300)]" style={{ left: '12.5%', right: '12.5%' }} />

                {/* Steps */}
                <div className="grid md:grid-cols-4 gap-8 relative">
                  {['1', '2', '3', '4'].map((step) => (
                    <div key={step} className="text-center">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[var(--wb-neutral-900)] text-white flex items-center justify-center font-bold text-lg relative z-10">
                        {step}
                      </div>
                      <h4 className="font-semibold mb-2 text-[var(--wb-neutral-900)]">
                        {t(`process.steps.${step}.title`)}
                      </h4>
                      <p className="text-sm text-[var(--wb-neutral-600)]">
                        {t(`process.steps.${step}.description`)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* What You'll Need */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-8 text-center text-[var(--wb-neutral-900)]">
                {t('requirements.title')}
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                {/* Business Information */}
                <div>
                  <h3 className="font-semibold mb-4 text-[var(--wb-neutral-900)]">
                    {t('requirements.business.title')}
                  </h3>
                  <ul className="space-y-3">
                    {['name', 'email', 'address', 'phone'].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-[var(--wb-neutral-600)]">
                          {t(`requirements.business.${item}`)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Optional Assets */}
                <div>
                  <h3 className="font-semibold mb-4 text-[var(--wb-neutral-900)]">
                    {t('requirements.assets.title')}
                  </h3>
                  <ul className="space-y-3">
                    {['logo', 'photos', 'examples', 'content'].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-[var(--wb-neutral-600)]">
                          {t(`requirements.assets.${item}`)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="text-center mb-8">
              <button
                onClick={handleStart}
                className="px-8 py-4 bg-[var(--wb-accent)] text-black font-semibold rounded-lg hover:bg-[var(--wb-accent)]/90 transition-colors inline-flex items-center gap-2"
              >
                <span>{t('actions.start')}</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <p className="text-sm text-[var(--wb-neutral-600)] mt-4">{t('disclaimer')}</p>
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
