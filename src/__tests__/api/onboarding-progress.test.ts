/**
 * E2E Test: Progress API Route Handlers
 * Tests for POST /api/onboarding/save and email verification routes
 */

import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3783';
const uniqueEmail = (base: string) => `test-e2e-${base}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;
const BYPASS_CODE = '123456'; // Dev/test bypass code

test.describe('Progress API Routes E2E', () => {
  test.describe('POST /api/onboarding/save', () => {
    test('should save form data to session', async ({ request }) => {
      // Create a session first
      const email = uniqueEmail('save');
      const createResponse = await request.post(`${API_BASE}/api/onboarding/session`, {
        data: { locale: 'en', email }
      });
      const { session } = await createResponse.json();

      // Save form data
      const saveResponse = await request.post(`${API_BASE}/api/onboarding/save`, {
        data: {
          sessionId: session.id,
          formData: {
            businessName: 'Test Business',
            step1Complete: true
          }
        }
      });

      expect(saveResponse.status()).toBe(200);
      const saveData = await saveResponse.json();
      expect(saveData.success).toBe(true);
      expect(saveData.session.form_data.businessName).toBe('Test Business');
      expect(saveData.session.form_data.step1Complete).toBe(true);
    });

    test('should merge form data with existing', async ({ request }) => {
      // Create session
      const email = uniqueEmail('merge');
      const createResponse = await request.post(`${API_BASE}/api/onboarding/session`, {
        data: { locale: 'en', email }
      });
      const { session } = await createResponse.json();

      // Save first batch
      await request.post(`${API_BASE}/api/onboarding/save`, {
        data: {
          sessionId: session.id,
          formData: { field1: 'value1' }
        }
      });

      // Save second batch
      const response = await request.post(`${API_BASE}/api/onboarding/save`, {
        data: {
          sessionId: session.id,
          formData: { field2: 'value2' }
        }
      });

      const data = await response.json();
      expect(data.session.form_data.field1).toBe('value1');
      expect(data.session.form_data.field2).toBe('value2');
    });

    test('should return 404 for non-existent session', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/onboarding/save`, {
        data: {
          sessionId: '00000000-0000-0000-0000-000000000000',
          formData: { test: 'data' }
        }
      });

      expect(response.status()).toBe(404);
    });
  });

  test.describe('POST /api/onboarding/email/verify', () => {
    test('should generate verification code', async ({ request }) => {
      // Create session
      const email = uniqueEmail('verify');
      const createResponse = await request.post(`${API_BASE}/api/onboarding/session`, {
        data: { locale: 'en', email }
      });
      const { session } = await createResponse.json();

      // Request OTP
      const response = await request.post(`${API_BASE}/api/onboarding/email/verify`, {
        data: { sessionId: session.id }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Verification code sent to your email');
    });

    test('should return 404 for non-existent session', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/onboarding/email/verify`, {
        data: { sessionId: '00000000-0000-0000-0000-000000000000' }
      });

      expect(response.status()).toBe(404);
    });
  });

  test.describe('POST /api/onboarding/email/verify/confirm', () => {
    test('should verify with bypass code in dev/test', async ({ request }) => {
      // Create session
      const email = uniqueEmail('confirm');
      const createResponse = await request.post(`${API_BASE}/api/onboarding/session`, {
        data: { locale: 'en', email }
      });
      const { session } = await createResponse.json();

      // Request verification code
      await request.post(`${API_BASE}/api/onboarding/email/verify`, {
        data: { sessionId: session.id }
      });

      // Confirm with bypass code
      const confirmResponse = await request.post(`${API_BASE}/api/onboarding/email/verify/confirm`, {
        data: { sessionId: session.id, code: BYPASS_CODE }
      });

      expect(confirmResponse.status()).toBe(200);
      const confirmData = await confirmResponse.json();
      expect(confirmData.success).toBe(true);
      expect(confirmData.session.email_verified).toBe(true);
    });

    test('should reject incorrect OTP', async ({ request }) => {
      // Create session
      const email = uniqueEmail('wrong');
      const createResponse = await request.post(`${API_BASE}/api/onboarding/session`, {
        data: { locale: 'en', email }
      });
      const { session } = await createResponse.json();

      // Request OTP
      await request.post(`${API_BASE}/api/onboarding/email/verify`, {
        data: { sessionId: session.id }
      });

      // Try wrong OTP
      const confirmResponse = await request.post(`${API_BASE}/api/onboarding/email/verify/confirm`, {
        data: { sessionId: session.id, code: '000000' }
      });

      expect(confirmResponse.status()).toBe(400);
      const data = await confirmResponse.json();
      expect(data.error).toContain('Invalid');
      expect(data.attempts_remaining).toBeDefined();
    });

    test('should lock out after 5 failed attempts', async ({ request }) => {
      // Create session
      const email = uniqueEmail('lockout');
      const createResponse = await request.post(`${API_BASE}/api/onboarding/session`, {
        data: { locale: 'en', email }
      });
      const { session } = await createResponse.json();

      // Request OTP
      await request.post(`${API_BASE}/api/onboarding/email/verify`, {
        data: { sessionId: session.id }
      });

      // Try 5 wrong attempts
      for (let i = 0; i < 5; i++) {
        await request.post(`${API_BASE}/api/onboarding/email/verify/confirm`, {
          data: { sessionId: session.id, code: '000000' }
        });
      }

      // 6th attempt should be locked out
      const lockoutResponse = await request.post(`${API_BASE}/api/onboarding/email/verify/confirm`, {
        data: { sessionId: session.id, code: '000000' }
      });

      expect(lockoutResponse.status()).toBe(429);
      const data = await lockoutResponse.json();
      expect(data.error).toContain('Too many');
      expect(data.locked_until).toBeDefined();
    });

    test('should reject already verified email', async ({ request }) => {
      // Create session and verify
      const email = uniqueEmail('already');
      const createResponse = await request.post(`${API_BASE}/api/onboarding/session`, {
        data: { locale: 'en', email }
      });
      const { session } = await createResponse.json();

      // Request and confirm with bypass code
      await request.post(`${API_BASE}/api/onboarding/email/verify`, {
        data: { sessionId: session.id }
      });

      await request.post(`${API_BASE}/api/onboarding/email/verify/confirm`, {
        data: { sessionId: session.id, code: BYPASS_CODE }
      });

      // Try to verify again
      await request.post(`${API_BASE}/api/onboarding/email/verify`, {
        data: { sessionId: session.id }
      });

      const secondConfirm = await request.post(`${API_BASE}/api/onboarding/email/verify/confirm`, {
        data: { sessionId: session.id, code: BYPASS_CODE }
      });

      expect(secondConfirm.status()).toBe(400);
      const data = await secondConfirm.json();
      expect(data.error).toContain('already verified');
    });
  });
});
