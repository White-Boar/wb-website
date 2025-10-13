import { loadStripe as loadStripeJS, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

/**
 * Load the Stripe.js library with the publishable key.
 * This is cached to avoid reloading on every call.
 *
 * @returns Promise resolving to Stripe instance
 */
export function loadStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = loadStripeJS(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
    );
  }

  return stripePromise;
}
