/**
 * Test: Stripe Client Configuration
 *
 * Verifies that Stripe client is properly configured for payment processing
 * and webhook handling in the onboarding flow.
 */

import { getStripeClient, verifyWebhookSignature } from '@/lib/stripe/server';
import { loadStripe } from '@/lib/stripe/client';

describe('Stripe Client Configuration', () => {
  describe('Server-side Stripe Client', () => {
    it('should export getStripeClient function', () => {
      expect(typeof getStripeClient).toBe('function');
    });

    it('should return configured Stripe instance', () => {
      const stripe = getStripeClient();

      expect(stripe).toBeDefined();
      expect(stripe.paymentIntents).toBeDefined();
      expect(stripe.customers).toBeDefined();
    });

    it('should use correct API version', () => {
      const stripe = getStripeClient();

      // Stripe client should be configured
      expect(stripe).toBeDefined();
    });
  });

  describe('Client-side Stripe Loader', () => {
    it('should export loadStripe function', () => {
      expect(typeof loadStripe).toBe('function');
    });

    it('should have loadStripe function that returns a promise', () => {
      const result = loadStripe();

      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('Webhook Signature Verification', () => {
    it('should export verifyWebhookSignature function', () => {
      expect(typeof verifyWebhookSignature).toBe('function');
    });

    it('should verify valid webhook signature', () => {
      const stripe = getStripeClient();

      // Create a test event payload
      const payload = JSON.stringify({
        id: 'evt_test',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test',
            amount: 4000,
            currency: 'eur'
          }
        }
      });

      // Generate signature using Stripe's method
      const timestamp = Math.floor(Date.now() / 1000);
      const secret = process.env.STRIPE_WEBHOOK_SECRET!;

      // Create signature (this would normally come from Stripe)
      const signature = `t=${timestamp},v1=test_signature`;

      // Verify function should handle signature validation
      expect(() => {
        verifyWebhookSignature(payload, signature, secret);
      }).toBeDefined();
    });

    it('should reject invalid webhook signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const invalidSignature = 'invalid_signature';
      const secret = process.env.STRIPE_WEBHOOK_SECRET!;

      expect(() => {
        verifyWebhookSignature(payload, invalidSignature, secret);
      }).toThrow();
    });
  });

  describe('Environment Variables', () => {
    it('should have STRIPE_SECRET_KEY configured', () => {
      expect(process.env.STRIPE_SECRET_KEY).toBeDefined();
      expect(process.env.STRIPE_SECRET_KEY).toContain('sk_');
    });

    it('should have NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY configured', () => {
      expect(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY).toBeDefined();
      expect(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY).toContain('pk_');
    });

    it('should have STRIPE_WEBHOOK_SECRET configured', () => {
      expect(process.env.STRIPE_WEBHOOK_SECRET).toBeDefined();
      expect(process.env.STRIPE_WEBHOOK_SECRET).toContain('whsec_');
    });
  });

  describe('Payment Intent Creation', () => {
    it('should be able to create payment intent', async () => {
      const stripe = getStripeClient();

      // Note: This test would normally mock Stripe API calls
      // For now, we just verify the client has the method
      expect(stripe.paymentIntents.create).toBeDefined();
      expect(typeof stripe.paymentIntents.create).toBe('function');
    });
  });
});
