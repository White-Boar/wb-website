/**
 * API Route: POST /api/onboarding/payment/intent
 * Creates Stripe PaymentIntent for onboarding submission
 */

import { NextRequest, NextResponse } from 'next/server';
import { createTestClient } from '@/lib/supabase/server';
import { createOnboardingPaymentIntent } from '@/lib/stripe/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { submissionId } = body;

    if (!submissionId) {
      return NextResponse.json(
        { error: 'submissionId is required' },
        { status: 400 }
      );
    }

    const supabase = createTestClient();

    // Get submission
    const { data: submission, error: fetchError } = await supabase
      .from('onboarding_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 400 }
      );
    }

    // Check if already paid
    if (submission.status === 'paid') {
      return NextResponse.json(
        { error: 'Submission already paid' },
        { status: 400 }
      );
    }

    // Create PaymentIntent
    let clientSecret: string;

    // In test/dev with placeholder keys, use mock client secret
    if (process.env.STRIPE_SECRET_KEY?.includes('placeholder')) {
      clientSecret = `pi_test_${submissionId.replace(/-/g, '')}_secret_mock`;
    } else {
      const paymentIntent = await createOnboardingPaymentIntent(
        submission.email,
        submissionId
      );
      clientSecret = paymentIntent.client_secret!;
    }

    return NextResponse.json(
      {
        clientSecret
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Payment intent API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
