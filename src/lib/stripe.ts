import Stripe from 'stripe';
import { loadStripe, Stripe as StripeJS } from '@stripe/stripe-js';

/**
 * Server-side Stripe client
 * Used for backend operations (subscription creation, webhooks, etc.)
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
  typescript: true,
});

/**
 * Client-side Stripe promise
 * Used for Stripe Elements on the frontend
 */
let stripePromise: Promise<StripeJS | null>;

export const getStripe = (): Promise<StripeJS | null> => {
  if (!stripePromise) {
    stripePromise = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
    );
  }
  return stripePromise;
};

/**
 * Validate Stripe configuration on server startup
 */
export const validateStripeConfig = (): void => {
  const requiredEnvVars = [
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_BASE_PACKAGE_PRICE_ID',
  ];

  const missing = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required Stripe environment variables: ${missing.join(', ')}`
    );
  }
};
