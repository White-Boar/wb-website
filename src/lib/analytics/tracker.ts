import { createTestClient } from '@/lib/supabase/server';

/**
 * Get Supabase client for analytics tracking.
 * Uses test client in test environment.
 */
function getAnalyticsClient() {
  return createTestClient();
}

/**
 * Track when a user views an onboarding step.
 *
 * @param sessionId - The onboarding session ID
 * @param stepNumber - The step number (1-13)
 */
export async function trackStepView(
  sessionId: string,
  stepNumber: number
): Promise<void> {
  const supabase = getAnalyticsClient();

  await supabase.from('onboarding_analytics').insert({
    session_id: sessionId,
    event_type: 'onboarding_step_viewed',
    category: 'user_action',
    step_number: stepNumber,
    metadata: {
      step_name: `Step ${stepNumber}`,
    },
  });
}

/**
 * Track when a user completes an onboarding step.
 *
 * @param sessionId - The onboarding session ID
 * @param stepNumber - The step number (1-13)
 * @param durationMs - Time spent on step in milliseconds
 */
export async function trackStepComplete(
  sessionId: string,
  stepNumber: number,
  durationMs?: number
): Promise<void> {
  const supabase = getAnalyticsClient();

  await supabase.from('onboarding_analytics').insert({
    session_id: sessionId,
    event_type: 'onboarding_step_completed',
    category: 'user_action',
    step_number: stepNumber,
    duration_ms: durationMs,
    metadata: {
      step_name: `Step ${stepNumber}`,
    },
  });
}

/**
 * Track when a validation error occurs on a field.
 *
 * @param sessionId - The onboarding session ID
 * @param stepNumber - The step number where error occurred
 * @param fieldName - The field that had the error
 * @param errorMessage - The validation error message
 */
export async function trackFieldError(
  sessionId: string,
  stepNumber: number,
  fieldName: string,
  errorMessage: string
): Promise<void> {
  const supabase = getAnalyticsClient();

  await supabase.from('onboarding_analytics').insert({
    session_id: sessionId,
    event_type: 'onboarding_field_error',
    category: 'error',
    step_number: stepNumber,
    field_name: fieldName,
    metadata: {
      error_message: errorMessage,
      error_type: 'validation',
    },
  });
}

/**
 * Track when the onboarding form is submitted (after Step 12).
 *
 * @param sessionId - The onboarding session ID
 * @param submissionId - The created submission ID
 */
export async function trackFormSubmitted(
  sessionId: string,
  submissionId: string
): Promise<void> {
  const supabase = getAnalyticsClient();

  await supabase.from('onboarding_analytics').insert({
    session_id: sessionId,
    event_type: 'onboarding_form_submitted',
    category: 'user_action',
    step_number: 12,
    metadata: {
      submission_id: submissionId,
    },
  });
}

/**
 * Track when payment is initiated (Step 13 loaded).
 *
 * @param sessionId - The onboarding session ID
 * @param amount - Payment amount in cents
 */
export async function trackPaymentInitiated(
  sessionId: string,
  amount: number
): Promise<void> {
  const supabase = getAnalyticsClient();

  await supabase.from('onboarding_analytics').insert({
    session_id: sessionId,
    event_type: 'onboarding_payment_initiated',
    category: 'user_action',
    step_number: 13,
    metadata: {
      amount,
      currency: 'EUR',
    },
  });
}

/**
 * Track when payment succeeds.
 *
 * @param sessionId - The onboarding session ID
 * @param transactionId - Stripe payment intent ID
 * @param amount - Payment amount in cents
 */
export async function trackPaymentSucceeded(
  sessionId: string,
  transactionId: string,
  amount: number
): Promise<void> {
  const supabase = getAnalyticsClient();

  await supabase.from('onboarding_analytics').insert({
    session_id: sessionId,
    event_type: 'onboarding_payment_succeeded',
    category: 'user_action',
    step_number: 13,
    metadata: {
      transaction_id: transactionId,
      amount,
      currency: 'EUR',
    },
  });
}

/**
 * Track when payment fails.
 *
 * @param sessionId - The onboarding session ID
 * @param errorCode - Stripe error code
 * @param errorMessage - Error message
 */
export async function trackPaymentFailed(
  sessionId: string,
  errorCode: string,
  errorMessage: string
): Promise<void> {
  const supabase = getAnalyticsClient();

  await supabase.from('onboarding_analytics').insert({
    session_id: sessionId,
    event_type: 'onboarding_payment_failed',
    category: 'error',
    step_number: 13,
    metadata: {
      error_code: errorCode,
      error_message: errorMessage,
    },
  });
}

/**
 * Track when a user completes the entire onboarding flow.
 *
 * @param sessionId - The onboarding session ID
 * @param totalDurationMs - Total time from start to completion
 */
export async function trackOnboardingCompleted(
  sessionId: string,
  totalDurationMs: number
): Promise<void> {
  const supabase = getAnalyticsClient();

  await supabase.from('onboarding_analytics').insert({
    session_id: sessionId,
    event_type: 'onboarding_completed',
    category: 'user_action',
    step_number: 13,
    duration_ms: totalDurationMs,
    metadata: {
      completion_time_seconds: Math.round(totalDurationMs / 1000),
    },
  });
}
