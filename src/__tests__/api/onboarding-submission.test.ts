/**
 * E2E Test: Submission API Route Handlers
 * Tests for POST /api/onboarding/submit and GET /api/onboarding/submission/[id]
 */

import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3783';
const uniqueEmail = (base: string) => `test-e2e-${base}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;

test.describe('Submission API Routes E2E', () => {
  test.describe('POST /api/onboarding/submit', () => {
    test('should create submission with status unpaid', async ({ request }) => {
      // Create session
      const email = uniqueEmail('submit');
      const createResponse = await request.post(`${API_BASE}/api/onboarding/session`, {
        data: { locale: 'en', email }
      });
      const { session } = await createResponse.json();

      // Save some form data
      await request.post(`${API_BASE}/api/onboarding/save`, {
        data: {
          sessionId: session.id,
          formData: { businessName: 'Test Business' }
        }
      });

      // Submit
      const response = await request.post(`${API_BASE}/api/onboarding/submit`, {
        data: { sessionId: session.id }
      });

      expect(response.status()).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.submission.id).toBeDefined();
      expect(data.submission.status).toBe('unpaid');
      expect(data.submission.email).toBe(email);
      expect(data.submission.business_name).toBe('Test Business');
      expect(data.submission.session_id).toBe(session.id);
    });

    test('should calculate completion_time_seconds', async ({ request }) => {
      // Create session
      const email = uniqueEmail('timing');
      const createResponse = await request.post(`${API_BASE}/api/onboarding/session`, {
        data: { locale: 'en', email }
      });
      const { session } = await createResponse.json();

      // Save form data including businessName
      await request.post(`${API_BASE}/api/onboarding/save`, {
        data: {
          sessionId: session.id,
          formData: { businessName: 'Test Business' }
        }
      });

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Submit
      const response = await request.post(`${API_BASE}/api/onboarding/submit`, {
        data: { sessionId: session.id }
      });

      const data = await response.json();
      expect(data.submission.completion_time_seconds).toBeGreaterThanOrEqual(1);
    });

    test('should return 409 if submission already exists', async ({ request }) => {
      // Create session
      const email = uniqueEmail('duplicate');
      const createResponse = await request.post(`${API_BASE}/api/onboarding/session`, {
        data: { locale: 'en', email }
      });
      const { session } = await createResponse.json();

      // Save form data including businessName
      await request.post(`${API_BASE}/api/onboarding/save`, {
        data: {
          sessionId: session.id,
          formData: { businessName: 'Test Business' }
        }
      });

      // Submit once
      await request.post(`${API_BASE}/api/onboarding/submit`, {
        data: { sessionId: session.id }
      });

      // Try to submit again
      const secondResponse = await request.post(`${API_BASE}/api/onboarding/submit`, {
        data: { sessionId: session.id }
      });

      expect(secondResponse.status()).toBe(409);
      const data = await secondResponse.json();
      expect(data.error).toContain('already exists');
    });

    test('should return 400 if businessName is missing', async ({ request }) => {
      // Create session without businessName in form_data
      const email = uniqueEmail('missing-business');
      const createResponse = await request.post(`${API_BASE}/api/onboarding/session`, {
        data: { locale: 'en', email }
      });
      const { session } = await createResponse.json();

      // Try to submit without businessName
      const response = await request.post(`${API_BASE}/api/onboarding/submit`, {
        data: { sessionId: session.id }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Business name is required');
    });

    test('should return 404 for non-existent session', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/onboarding/submit`, {
        data: { sessionId: '00000000-0000-0000-0000-000000000000' }
      });

      expect(response.status()).toBe(404);
    });
  });

  test.describe('GET /api/onboarding/submission/[id]', () => {
    test('should retrieve submission by id', async ({ request }) => {
      // Create session and submit
      const email = uniqueEmail('retrieve');
      const createResponse = await request.post(`${API_BASE}/api/onboarding/session`, {
        data: { locale: 'en', email }
      });
      const { session } = await createResponse.json();

      // Save form data including businessName
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

      // Retrieve submission
      const getResponse = await request.get(`${API_BASE}/api/onboarding/submission/${submission.id}`);

      expect(getResponse.status()).toBe(200);
      const getData = await getResponse.json();
      expect(getData.submission.id).toBe(submission.id);
      expect(getData.submission.status).toBe('unpaid');
      expect(getData.submission.email).toBe(email);
    });

    test('should return 404 for non-existent submission', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/onboarding/submission/00000000-0000-0000-0000-000000000000`);

      expect(response.status()).toBe(404);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });
});
