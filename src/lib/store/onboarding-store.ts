/**
 * Onboarding Session Metadata Store (Zustand)
 *
 * IMPORTANT: This store contains ONLY session metadata, NOT form data.
 * Form data belongs in React Hook Form - maintaining single source of truth.
 *
 * Persisted to localStorage with key "wb-onboarding-meta"
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SessionState } from '@/types/onboarding';

interface OnboardingStore extends SessionState {
  // Actions
  setSessionId: (sessionId: string | null) => void;
  setCurrentStep: (step: number) => void;
  setLastSaved: (timestamp: string | null) => void;
  resetSession: () => void;
}

const initialState: SessionState = {
  sessionId: null,
  currentStep: 1,
  lastSaved: null,
};

/**
 * Zustand store for onboarding session metadata.
 *
 * This store ONLY manages:
 * - sessionId: Unique identifier for the onboarding session
 * - currentStep: Current step number (1-13)
 * - lastSaved: ISO 8601 timestamp of last save
 *
 * DO NOT store form data here. Form data must be managed by React Hook Form.
 */
export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      // State
      ...initialState,

      // Actions
      setSessionId: (sessionId) => set({ sessionId }),
      setCurrentStep: (currentStep) => {
        // Validate step number
        if (currentStep < 1 || currentStep > 13) {
          console.error(`Invalid step number: ${currentStep}. Must be between 1 and 13.`);
          return;
        }
        set({ currentStep });
      },
      setLastSaved: (lastSaved) => set({ lastSaved }),
      resetSession: () => set(initialState),
    }),
    {
      name: 'wb-onboarding-meta', // localStorage key
      // Only persist the session metadata, not the actions
      partialize: (state) => ({
        sessionId: state.sessionId,
        currentStep: state.currentStep,
        lastSaved: state.lastSaved,
      }),
    }
  )
);

/**
 * Helper hook to check if a session is active
 */
export const useHasActiveSession = () => {
  const sessionId = useOnboardingStore((state) => state.sessionId);
  return sessionId !== null;
};

/**
 * Helper hook to get session metadata
 */
export const useSessionMetadata = () => {
  return useOnboardingStore((state) => ({
    sessionId: state.sessionId,
    currentStep: state.currentStep,
    lastSaved: state.lastSaved,
  }));
};
