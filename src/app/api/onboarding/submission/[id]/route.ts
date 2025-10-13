/**
 * API Route: GET /api/onboarding/submission/[id]
 * Retrieves submission details by ID
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
        { status: 404 }
      );
    }

    return NextResponse.json(
      { submission },
      { status: 200 }
    );
  } catch (error) {
    console.error('Submission GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
