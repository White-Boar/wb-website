import Stripe from 'stripe';

/**
 * Get a configured Stripe instance for server-side use.
 * Uses the secret key for full API access.
 *
 * @returns Configured Stripe client
 */
export function getStripeClient(): Stripe {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-09-30.clover',
    typescript: true,
    // Provide fetch for Node.js environment
    httpClient: Stripe.createFetchHttpClient(),
  });

  return stripe;
}

/**
 * Verify a Stripe webhook signature to ensure the webhook event is authentic.
 *
 * @param payload - The raw request body as a string
 * @param signature - The Stripe signature from the request headers
 * @param webhookSecret - The webhook secret from Stripe dashboard
 * @returns The verified Stripe event
 * @throws Error if signature verification fails
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  const stripe = getStripeClient();

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );

    return event;
  } catch (err) {
    const error = err as Error;
    throw new Error(`Webhook signature verification failed: ${error.message}`);
  }
}

/**
 * Create a payment intent for the onboarding subscription.
 * Amount is €40/month = 4000 cents.
 *
 * @param email - Customer email address
 * @param submissionId - The submission ID to attach as metadata
 * @returns Payment intent with client secret
 */
export async function createOnboardingPaymentIntent(
  email: string,
  submissionId: string
) {
  const stripe = getStripeClient();

  const paymentIntent = await stripe.paymentIntents.create({
    amount: 4000, // €40.00
    currency: 'eur',
    receipt_email: email,
    metadata: {
      submission_id: submissionId,
      product: 'onboarding_fast_simple',
    },
    description: 'WhiteBoar Fast & Simple Website Package - €40/month',
  });

  return paymentIntent;
}
