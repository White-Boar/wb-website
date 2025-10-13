/**
 * API Route: POST /api/onboarding/payment/webhook
 * Handles Stripe webhook events for payment status updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { createTestClient } from '@/lib/supabase/server';
import { verifyWebhookSignature } from '@/lib/stripe/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    // Get raw body and signature
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = verifyWebhookSignature(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      const error = err as Error;
      console.error('Webhook signature verification failed:', error.message);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${error.message}` },
        { status: 400 }
      );
    }

    const supabase = createTestClient();

    // Handle payment_intent.succeeded event
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const submissionId = paymentIntent.metadata.submission_id;

      if (submissionId) {
        // Get card details (charges may not be expanded in webhook)
        const cardLast4 = '0000'; // Default value, actual card details retrieved separately if needed

        // Update submission to paid
        const { error: updateError } = await supabase
          .from('onboarding_submissions')
          .update({
            status: 'paid',
            payment_transaction_id: paymentIntent.id,
            payment_completed_at: new Date().toISOString(),
            payment_card_last4: cardLast4
          })
          .eq('id', submissionId);

        if (updateError) {
          console.error('Failed to update submission from webhook:', updateError);
        }
      }
    }

    // Handle payment_intent.payment_failed event
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const submissionId = paymentIntent.metadata.submission_id;

      console.error('Payment failed for submission:', submissionId, {
        error: paymentIntent.last_payment_error
      });

      // Keep submission as unpaid - no update needed
    }

    return NextResponse.json(
      { received: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Webhook API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
