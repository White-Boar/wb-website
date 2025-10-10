/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import {
  useOnboardingStore,
  useHasActiveSession,
} from '@/lib/store/onboarding-store';

describe('useOnboardingStore', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    // Reset the store to initial state
    const { result } = renderHook(() => useOnboardingStore());
    act(() => {
      result.current.resetSession();
    });
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => useOnboardingStore());

    expect(result.current.sessionId).toBeNull();
    expect(result.current.currentStep).toBe(1);
    expect(result.current.lastSaved).toBeNull();
  });

  it('sets session ID', () => {
    const { result } = renderHook(() => useOnboardingStore());

    act(() => {
      result.current.setSessionId('test-session-123');
    });

    expect(result.current.sessionId).toBe('test-session-123');
  });

  it('sets current step', () => {
    const { result } = renderHook(() => useOnboardingStore());

    act(() => {
      result.current.setCurrentStep(5);
    });

    expect(result.current.currentStep).toBe(5);
  });

  it('rejects invalid step numbers (less than 1)', () => {
    const { result } = renderHook(() => useOnboardingStore());
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    act(() => {
      result.current.setCurrentStep(0);
    });

    expect(result.current.currentStep).toBe(1); // Should remain unchanged
    expect(consoleSpy).toHaveBeenCalledWith('Invalid step number: 0. Must be between 1 and 13.');

    consoleSpy.mockRestore();
  });

  it('rejects invalid step numbers (greater than 13)', () => {
    const { result } = renderHook(() => useOnboardingStore());
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    act(() => {
      result.current.setCurrentStep(14);
    });

    expect(result.current.currentStep).toBe(1); // Should remain unchanged
    expect(consoleSpy).toHaveBeenCalledWith('Invalid step number: 14. Must be between 1 and 13.');

    consoleSpy.mockRestore();
  });

  it('sets lastSaved timestamp', () => {
    const { result } = renderHook(() => useOnboardingStore());
    const timestamp = new Date().toISOString();

    act(() => {
      result.current.setLastSaved(timestamp);
    });

    expect(result.current.lastSaved).toBe(timestamp);
  });

  it('resets session to initial state', () => {
    const { result } = renderHook(() => useOnboardingStore());

    // Set some values
    act(() => {
      result.current.setSessionId('test-session');
      result.current.setCurrentStep(10);
      result.current.setLastSaved('2025-01-01T00:00:00.000Z');
    });

    expect(result.current.sessionId).toBe('test-session');
    expect(result.current.currentStep).toBe(10);
    expect(result.current.lastSaved).toBe('2025-01-01T00:00:00.000Z');

    // Reset
    act(() => {
      result.current.resetSession();
    });

    expect(result.current.sessionId).toBeNull();
    expect(result.current.currentStep).toBe(1);
    expect(result.current.lastSaved).toBeNull();
  });
});

describe('useHasActiveSession', () => {
  beforeEach(() => {
    localStorage.clear();
    const { result } = renderHook(() => useOnboardingStore());
    act(() => {
      result.current.resetSession();
    });
  });

  it('returns false when no session ID', () => {
    const { result } = renderHook(() => useHasActiveSession());
    expect(result.current).toBe(false);
  });

  it('returns true when session ID exists', () => {
    const { result: storeResult } = renderHook(() => useOnboardingStore());

    act(() => {
      storeResult.current.setSessionId('active-session');
    });

    const { result: hasSessionResult } = renderHook(() => useHasActiveSession());
    expect(hasSessionResult.current).toBe(true);
  });

  it('returns false after session reset', () => {
    const { result: storeResult } = renderHook(() => useOnboardingStore());

    act(() => {
      storeResult.current.setSessionId('active-session');
    });

    const { result: hasSessionResult } = renderHook(() => useHasActiveSession());
    expect(hasSessionResult.current).toBe(true);

    act(() => {
      storeResult.current.resetSession();
    });

    expect(hasSessionResult.current).toBe(false);
  });
});
