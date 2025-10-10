'use client';

/**
 * Welcome Component
 *
 * Landing page for the onboarding flow.
 * Displays value proposition, process overview, and "Start Your Website" CTA.
 * Includes restart functionality for returning users.
 *
 * Visual Reference: context/Visual design/onboarding-00-welcome.png
 */

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useOnboardingStore, useHasActiveSession } from '@/lib/store/onboarding-store';
import { ProgressBar } from './ProgressBar';
import { StepNavigation } from './StepNavigation';

export function Welcome() {
  const t = useTranslations('onboarding.welcome');
  const router = useRouter();
  const hasActiveSession = useHasActiveSession();
  const { resetSession, setCurrentStep } = useOnboardingStore();

  const handleStart = () => {
    // For foundation sprint: Start fresh session and navigate to thank you
    // Future sprints: Will navigate to Step 1 (personal info)
    setCurrentStep(1);
  };

  const handleRestart = () => {
    resetSession();
    setCurrentStep(1);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[var(--wb-background)]">
      {/* Progress Bar */}
      <ProgressBar />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[var(--wb-neutral-900)]">
              {t('title')}
            </h1>
            <p className="text-xl text-[var(--wb-neutral-600)] max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Fast */}
            <div className="text-center p-6 rounded-lg bg-white border border-[var(--wb-neutral-200)]">
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-[var(--wb-neutral-900)]">
                {t('features.fast.title')}
              </h3>
              <p className="text-sm text-[var(--wb-neutral-600)]">
                {t('features.fast.description')}
              </p>
            </div>

            {/* Secure */}
            <div className="text-center p-6 rounded-lg bg-white border border-[var(--wb-neutral-200)]">
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
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-[var(--wb-neutral-900)]">
                {t('features.secure.title')}
              </h3>
              <p className="text-sm text-[var(--wb-neutral-600)]">
                {t('features.secure.description')}
              </p>
            </div>

            {/* Smart */}
            <div className="text-center p-6 rounded-lg bg-white border border-[var(--wb-neutral-200)]">
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
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-[var(--wb-neutral-900)]">
                {t('features.smart.title')}
              </h3>
              <p className="text-sm text-[var(--wb-neutral-600)]">
                {t('features.smart.description')}
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="mb-12 p-8 rounded-lg bg-white border border-[var(--wb-neutral-200)]">
            <h2 className="text-2xl font-bold mb-6 text-center text-[var(--wb-neutral-900)]">
              {t('process.title')}
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {['1', '2', '3', '4'].map((step) => (
                <div key={step} className="text-center">
                  <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-[var(--wb-accent)] text-white flex items-center justify-center font-bold">
                    {step}
                  </div>
                  <h4 className="font-semibold mb-1 text-[var(--wb-neutral-900)]">
                    {t(`process.steps.${step}.title`)}
                  </h4>
                  <p className="text-sm text-[var(--wb-neutral-600)]">
                    {t(`process.steps.${step}.description`)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center mb-8">
            <p className="text-sm text-[var(--wb-neutral-600)] mb-4">{t('disclaimer')}</p>
            {hasActiveSession && (
              <button
                onClick={handleRestart}
                className="text-sm text-[var(--wb-neutral-600)] hover:text-[var(--wb-neutral-900)] underline mb-4"
              >
                {t('actions.startOver')}
              </button>
            )}
          </div>

          {/* Navigation */}
          <StepNavigation currentStep={1} onNext={handleStart} />
        </div>
      </div>
    </div>
  );
}
