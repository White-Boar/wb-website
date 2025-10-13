/**
 * E2E Test: Payment API Route Handlers
 * Tests for payment intent creation, completion, status, and webhook handling
 */

import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3783';
const uniqueEmail = (base: string) => `test-e2e-${base}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;

test.describe('Payment API Routes E2E', () => {
  test.describe('POST /api/onboarding/payment/intent', () => {
    test('should create PaymentIntent for €40', async ({ request }) => {
      // Create session and submission
      const email = uniqueEmail('payment');
      const createResponse = await request.post(`${API_BASE}/api/onboarding/session`, {
        data: { locale: 'en', email }
      });
      const { session } = await createResponse.json();

      // Save form data and submit
      await request.post(`${API_BASE}/api/onboarding/save`, {
        data: {
          sessionId: session.id,
          formData: { businessName: 'Test Business' }
        }
      });

      const submitResponse = await request.post(`${API_BASE}/api/onboarding/submit`, {
        data: { sessionId: session.id }
      });
      const { submission } = await submitResponse.json();

      // Create payment intent
      const response = await request.post(`${API_BASE}/api/onboarding/payment/intent`, {
        data: { submissionId: submission.id }
      });

      expect(response.status()).toBe(201);
      const data = await response.json();
      expect(data.clientSecret).toBeDefined();
      expect(data.clientSecret).toContain('pi_');
    });

    test('should return 400 if submission not found', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/onboarding/payment/intent`, {
        data: { submissionId: '00000000-0000-0000-0000-000000000000' }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    test('should return 400 if submission already paid', async ({ request }) => {
      // Create session and submission
      const email = uniqueEmail('already-paid');
      const createResponse = await request.post(`${API_BASE}/api/onboarding/session`, {
        data: { locale: 'en', email }
      });
      const { session } = await createResponse.json();

      await request.post(`${API_BASE}/api/onboarding/save`, {
        data: {
          sessionId: session.id,
          formData: { businessName: 'Test Business' }
        }
      });

      const submitResponse = await request.post(`${API_BASE}/api/onboarding/submit`, {
        data: { sessionId: session.id }
      });
      const { submission } = await submitResponse.json();

      // Create first payment intent
      await request.post(`${API_BASE}/api/onboarding/payment/intent`, {
        data: { submissionId: submission.id }
      });

      // Mark as paid (simulate completion)
      await request.post(`${API_BASE}/api/onboarding/payment/complete`, {
        data: {
          submissionId: submission.id,
          paymentIntentId: 'pi_test_123',
          cardLast4: '4242'
        }
      });

      // Try to create another payment intent
      const secondResponse = await request.post(`${API_BASE}/api/onboarding/payment/intent`, {
        data: { submissionId: submission.id }
      });

      expect(secondResponse.status()).toBe(400);
      const data = await secondResponse.json();
      expect(data.error).toContain('already paid');
    });
  });

  test.describe('POST /api/onboarding/payment/complete', () => {
    test('should mark submission as paid', async ({ request }) => {
      // Create session and submission
      const email = uniqueEmail('complete');
      const createResponse = await request.post(`${API_BASE}/api/onboarding/session`, {
        data: { locale: 'en', email }
      });
      const { session } = await createResponse.json();

      await request.post(`${API_BASE}/api/onboarding/save`, {
        data: {
          sessionId: session.id,
          formData: { businessName: 'Test Business' }
        }
      });

      const submitResponse = await request.post(`${API_BASE}/api/onboarding/submit`, {
        data: { sessionId: session.id }
      });
      const { submission } = await submitResponse.json();

      // Complete payment
      const response = await request.post(`${API_BASE}/api/onboarding/payment/complete`, {
        data: {
          submissionId: submission.id,
          paymentIntentId: 'pi_test_completed_123',
          cardLast4: '4242'
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.submission.status).toBe('paid');
      expect(data.submission.payment_transaction_id).toBe('pi_test_completed_123');
      expect(data.submission.payment_card_last4).toBe('4242');
      expect(data.submission.payment_completed_at).toBeDefined();
    });

    test('should return 400 if submission not found', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/onboarding/payment/complete`, {
        data: {
          submissionId: '00000000-0000-0000-0000-000000000000',
          paymentIntentId: 'pi_test_123',
          cardLast4: '4242'
        }
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe('GET /api/onboarding/payment/status/[id]', () => {
    test('should return pending status for unpaid submission', async ({ request }) => {
      // Create session and submission
      const email = uniqueEmail('status-pending');
      const createResponse = await request.post(`${API_BASE}/api/onboarding/session`, {
        data: { locale: 'en', email }
      });
      const { session } = await createResponse.json();

      await request.post(`${API_BASE}/api/onboarding/save`, {
        data: {
          sessionId: session.id,
          formData: { businessName: 'Test Business' }
        }
      });

      const submitResponse = await request.post(`${API_BASE}/api/onboarding/submit`, {
        data: { sessionId: session.id }
      });
      const { submission } = await submitResponse.json();

      // Get status
      const response = await request.get(`${API_BASE}/api/onboarding/payment/status/${submission.id}`);

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('pending');
    });

    test('should return succeeded status for paid submission', async ({ request }) => {
      // Create session and submission
      const email = uniqueEmail('status-paid');
      const createResponse = await request.post(`${API_BASE}/api/onboarding/session`, {
        data: { locale: 'en', email }
      });
      const { session } = await createResponse.json();

      await request.post(`${API_BASE}/api/onboarding/save`, {
        data: {
          sessionId: session.id,
          formData: { businessName: 'Test Business' }
        }
      });

      const submitResponse = await request.post(`${API_BASE}/api/onboarding/submit`, {
        data: { sessionId: session.id }
      });
      const { submission } = await submitResponse.json();

      // Mark as paid
      await request.post(`${API_BASE}/api/onboarding/payment/complete`, {
        data: {
          submissionId: submission.id,
          paymentIntentId: 'pi_test_123',
          cardLast4: '4242'
        }
      });

      // Get status
      const response = await request.get(`${API_BASE}/api/onboarding/payment/status/${submission.id}`);

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('succeeded');
    });

    test('should return 400 if submission not found', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/onboarding/payment/status/00000000-0000-0000-0000-000000000000`);

      expect(response.status()).toBe(400);
    });
  });

  test.describe('POST /api/onboarding/payment/webhook', () => {
    test('should return 400 for invalid signature', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/onboarding/payment/webhook`, {
        data: { type: 'payment_intent.succeeded' },
        headers: {
          'stripe-signature': 'invalid_signature'
        }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('signature');
    });

    // NOTE: Full webhook testing with valid signatures requires Stripe CLI
    // and is better suited for integration tests. This test verifies the
    // signature validation logic.
  });
});
