/**
 * API Route: POST /api/onboarding/payment/complete
 * Marks submission as paid after successful Stripe payment
 */

import { NextRequest, NextResponse } from 'next/server';
import { createTestClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { submissionId, paymentIntentId, cardLast4 } = body;

    if (!submissionId || !paymentIntentId || !cardLast4) {
      return NextResponse.json(
        { error: 'submissionId, paymentIntentId, and cardLast4 are required' },
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

    // Update submission to paid
    const { data: updatedSubmission, error: updateError } = await supabase
      .from('onboarding_submissions')
      .update({
        status: 'paid',
        payment_transaction_id: paymentIntentId,
        payment_completed_at: new Date().toISOString(),
        payment_card_last4: cardLast4
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (updateError || !updatedSubmission) {
      console.error('Failed to update submission:', updateError);
      return NextResponse.json(
        { error: 'Failed to update submission' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        submission: updatedSubmission
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Payment complete API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
