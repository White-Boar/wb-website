/**
 * Test: Analytics Tracking Utility
 *
 * Verifies that analytics events are properly tracked and stored
 * in the onboarding_analytics table.
 */

import {
  trackStepView,
  trackStepComplete,
  trackFieldError,
  trackFormSubmitted,
  trackPaymentInitiated,
  trackPaymentSucceeded,
  trackPaymentFailed,
} from '@/lib/analytics/tracker';
import { createTestClient } from '@/lib/supabase/server';

describe('Analytics Tracking Utility', () => {
  describe('Event Tracking Functions', () => {
    it('should export trackStepView function', () => {
      expect(typeof trackStepView).toBe('function');
    });

    it('should export trackStepComplete function', () => {
      expect(typeof trackStepComplete).toBe('function');
    });

    it('should export trackFieldError function', () => {
      expect(typeof trackFieldError).toBe('function');
    });

    it('should export trackFormSubmitted function', () => {
      expect(typeof trackFormSubmitted).toBe('function');
    });

    it('should export trackPaymentInitiated function', () => {
      expect(typeof trackPaymentInitiated).toBe('function');
    });

    it('should export trackPaymentSucceeded function', () => {
      expect(typeof trackPaymentSucceeded).toBe('function');
    });

    it('should export trackPaymentFailed function', () => {
      expect(typeof trackPaymentFailed).toBe('function');
    });
  });

  describe('Track Step View', () => {
    // Skip integration test in CI - requires live Supabase connection
    it.skip('should create analytics event for step view', async () => {
      const supabase = createTestClient();

      // Create test session
      const { data: session, error: sessionError } = await supabase
        .from('onboarding_sessions')
        .insert({ email: `test-analytics-${Date.now()}@test.com` })
        .select()
        .single();

      expect(sessionError).toBeNull();
      expect(session).toBeDefined();

      // Track step view
      await trackStepView(session!.id, 1);

      // Verify event was created
      const { data: events } = await supabase
        .from('onboarding_analytics')
        .select('*')
        .eq('session_id', session!.id)
        .eq('event_type', 'onboarding_step_viewed')
        .eq('step_number', 1);

      expect(events).toHaveLength(1);
      expect(events![0].category).toBe('user_action');

      // Cleanup
      await supabase
        .from('onboarding_sessions')
        .delete()
        .eq('id', session!.id);
    });
  });

  describe('Track Step Complete', () => {
    it.skip('should create analytics event for step completion', async () => {
      const supabase = createTestClient();

      const { data: session } = await supabase
        .from('onboarding_sessions')
        .insert({ email: `test-complete-${Date.now()}@test.com` })
        .select()
        .single();

      await trackStepComplete(session!.id, 2, 5000);

      const { data: events } = await supabase
        .from('onboarding_analytics')
        .select('*')
        .eq('session_id', session!.id)
        .eq('event_type', 'onboarding_step_completed');

      expect(events).toHaveLength(1);
      expect(events![0].step_number).toBe(2);
      expect(events![0].duration_ms).toBe(5000);

      await supabase
        .from('onboarding_sessions')
        .delete()
        .eq('id', session!.id);
    });
  });

  describe('Track Field Error', () => {
    it.skip('should create analytics event for field error', async () => {
      const supabase = createTestClient();

      const { data: session } = await supabase
        .from('onboarding_sessions')
        .insert({ email: `test-error-${Date.now()}@test.com` })
        .select()
        .single();

      await trackFieldError(session!.id, 1, 'email', 'Invalid email format');

      const { data: events } = await supabase
        .from('onboarding_analytics')
        .select('*')
        .eq('session_id', session!.id)
        .eq('event_type', 'onboarding_field_error');

      expect(events).toHaveLength(1);
      expect(events![0].field_name).toBe('email');
      expect(events![0].category).toBe('error');

      await supabase
        .from('onboarding_sessions')
        .delete()
        .eq('id', session!.id);
    });
  });

  describe('Track Payment Events', () => {
    it.skip('should track payment initiated event', async () => {
      const supabase = createTestClient();

      const { data: session } = await supabase
        .from('onboarding_sessions')
        .insert({ email: `test-payment-${Date.now()}@test.com` })
        .select()
        .single();

      await trackPaymentInitiated(session!.id, 4000);

      const { data: events } = await supabase
        .from('onboarding_analytics')
        .select('*')
        .eq('session_id', session!.id)
        .eq('event_type', 'onboarding_payment_initiated');

      expect(events).toHaveLength(1);
      expect(events![0].metadata).toHaveProperty('amount');

      await supabase
        .from('onboarding_sessions')
        .delete()
        .eq('id', session!.id);
    });

    it.skip('should track payment succeeded event', async () => {
      const supabase = createTestClient();

      const { data: session } = await supabase
        .from('onboarding_sessions')
        .insert({ email: `test-payment-success-${Date.now()}@test.com` })
        .select()
        .single();

      await trackPaymentSucceeded(session!.id, 'pi_test123', 4000);

      const { data: events } = await supabase
        .from('onboarding_analytics')
        .select('*')
        .eq('session_id', session!.id)
        .eq('event_type', 'onboarding_payment_succeeded');

      expect(events).toHaveLength(1);
      expect(events![0].metadata).toHaveProperty('transaction_id', 'pi_test123');

      await supabase
        .from('onboarding_sessions')
        .delete()
        .eq('id', session!.id);
    });

    it.skip('should track payment failed event', async () => {
      const supabase = createTestClient();

      const { data: session } = await supabase
        .from('onboarding_sessions')
        .insert({ email: `test-payment-fail-${Date.now()}@test.com` })
        .select()
        .single();

      await trackPaymentFailed(session!.id, 'card_declined', 'Card was declined');

      const { data: events } = await supabase
        .from('onboarding_analytics')
        .select('*')
        .eq('session_id', session!.id)
        .eq('event_type', 'onboarding_payment_failed');

      expect(events).toHaveLength(1);
      expect(events![0].category).toBe('error');
      expect(events![0].metadata).toHaveProperty('error_code', 'card_declined');

      await supabase
        .from('onboarding_sessions')
        .delete()
        .eq('id', session!.id);
    });
  });
});
