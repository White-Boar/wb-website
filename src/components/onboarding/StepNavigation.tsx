'use client';

/**
 * StepNavigation Component
 *
 * Handles navigation between onboarding steps with Next/Back buttons.
 * For foundation sprint: Simplified navigation (Welcome → Thank You, no form validation)
 * Future sprints: Will include form validation and API calls
 */

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useOnboardingStore } from '@/lib/store/onboarding-store';

interface StepNavigationProps {
  currentStep: number;
  onNext?: () => void | Promise<void>;
  onBack?: () => void;
  isNextDisabled?: boolean;
  isLoading?: boolean;
}

export function StepNavigation({
  currentStep,
  onNext,
  onBack,
  isNextDisabled = false,
  isLoading = false,
}: StepNavigationProps) {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const { setCurrentStep } = useOnboardingStore();
  const [isNavigating, setIsNavigating] = useState(false);

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === 13;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      // Default back behavior
      if (currentStep > 1) {
        setCurrentStep(currentStep - 1);
        if (currentStep === 2) {
          router.push('/onboarding');
        }
      }
    }
  };

  const handleNext = async () => {
    setIsNavigating(true);
    try {
      if (onNext) {
        await onNext();
      } else {
        // Default next behavior for foundation sprint
        // For foundation sprint: Go directly from Welcome (step 1) to Thank You page
        setCurrentStep(13); // Set to step 13 (thank you page)
        router.push('/onboarding/thank-you');
      }
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      setIsNavigating(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-[var(--wb-neutral-200)]">
      {/* Back Button */}
      {!isFirstStep && !isLastStep && (
        <button
          type="button"
          onClick={handleBack}
          disabled={isNavigating || isLoading}
          className="px-6 py-3 text-[var(--wb-neutral-700)] bg-white border border-[var(--wb-neutral-300)] rounded-lg hover:bg-[var(--wb-neutral-50)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--wb-accent)]"
          aria-label={t('previous')}
        >
          <span className="flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            {t('previous')}
          </span>
        </button>
      )}

      {/* Spacer for alignment when no back button */}
      {(isFirstStep || isLastStep) && <div className="flex-1" />}

      {/* Next Button */}
      {!isLastStep && (
        <button
          type="button"
          onClick={handleNext}
          disabled={isNextDisabled || isNavigating || isLoading}
          className="ml-auto px-6 py-3 text-white bg-[var(--wb-primary)] rounded-lg hover:bg-[var(--wb-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--wb-accent)]"
          aria-label={t('next')}
        >
          <span className="flex items-center gap-2">
            {isNavigating || isLoading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {t('loading')}
              </>
            ) : (
              <>
                {t('next')}
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </>
            )}
          </span>
        </button>
      )}
    </div>
  );
}
