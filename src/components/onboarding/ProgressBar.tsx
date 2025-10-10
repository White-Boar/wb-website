'use client';

/**
 * ProgressBar Component
 *
 * Displays the current progress through the onboarding flow.
 * For foundation sprint: Simplified 2-step flow (Welcome → Thank You)
 * Future sprints: Will show all 13 steps
 */

import { useTranslations } from 'next-intl';
import { useOnboardingStore } from '@/lib/store/onboarding-store';

export function ProgressBar() {
  const t = useTranslations('onboarding');
  const currentStep = useOnboardingStore((state) => state.currentStep);

  // For foundation sprint: Simplified 2-step progress
  // Step 1 = Welcome, Step 13 = Thank You (we skip steps 2-12 for now)
  const totalSteps = 2;
  const displayStep = currentStep === 1 ? 1 : 2;
  const progressPercentage = (displayStep / totalSteps) * 100;

  return (
    <div className="w-full py-4 px-4 sm:px-6 bg-[var(--wb-neutral-50)] border-b border-[var(--wb-neutral-200)]">
      <div className="max-w-4xl mx-auto">
        {/* Progress text */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-[var(--wb-neutral-700)]" aria-live="polite">
            {t('step')} {displayStep} {t('of')} {totalSteps}
          </p>
          <p className="text-sm text-[var(--wb-neutral-600)]">{Math.round(progressPercentage)}%</p>
        </div>

        {/* Progress bar */}
        <div
          className="w-full h-2 bg-[var(--wb-neutral-200)] rounded-full overflow-hidden"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={totalSteps}
          aria-valuenow={displayStep}
          aria-label={t('progressLabel', { step: displayStep, total: totalSteps })}
        >
          <div
            className="h-full bg-[var(--wb-accent)] transition-all duration-300 ease-in-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Step indicators (mobile: hidden, desktop: shown) */}
        <div className="hidden sm:flex justify-between mt-4" aria-hidden="true">
          {[1, 2].map((step) => {
            const isCompleted = step < displayStep;
            const isCurrent = step === displayStep;
            const isUpcoming = step > displayStep;

            return (
              <div
                key={step}
                className={`flex-1 text-center transition-all duration-200 ${
                  isCurrent
                    ? 'text-[var(--wb-accent)] font-semibold'
                    : isCompleted
                      ? 'text-[var(--wb-neutral-700)]'
                      : 'text-[var(--wb-neutral-400)]'
                }`}
              >
                <div
                  className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-1 border-2 ${
                    isCurrent
                      ? 'bg-[var(--wb-accent)] text-white border-[var(--wb-accent)]'
                      : isCompleted
                        ? 'bg-[var(--wb-accent)] text-white border-[var(--wb-accent)]'
                        : 'bg-white border-[var(--wb-neutral-300)]'
                  }`}
                >
                  {isCompleted ? (
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span className="text-sm">{step}</span>
                  )}
                </div>
                <p className="text-xs">
                  {step === 1 ? t('welcome.title') : t('thankYou.title').substring(0, 20)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
