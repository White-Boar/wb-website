/**
 * API Route: GET /api/onboarding/payment/status/[id]
 * Returns payment status for a submission
 */

import { NextRequest, NextResponse } from 'next/server';
import { createTestClient } from '@/lib/supabase/server';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const supabase = createTestClient();
    const { data: submission, error } = await supabase
      .from('onboarding_submissions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 400 }
      );
    }

    // Check if more than 24 hours since submission creation
    const createdAt = new Date(submission.created_at);
    const now = new Date();
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceCreation > 24) {
      return NextResponse.json(
        { error: 'Verification window expired (24 hours)' },
        { status: 400 }
      );
    }

    // Determine status
    let status = 'pending';
    if (submission.status === 'paid') {
      status = 'succeeded';
    } else if (submission.status === 'failed') {
      status = 'failed';
    }

    return NextResponse.json(
      { status },
      { status: 200 }
    );
  } catch (error) {
    console.error('Payment status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
