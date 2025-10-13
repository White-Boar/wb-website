/**
 * API Route: POST /api/onboarding/submit
 * Creates submission record when user completes onboarding
 */

import { NextRequest, NextResponse } from 'next/server';
import { createTestClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    const supabase = createTestClient();

    // Get session
    const { data: session, error: fetchError } = await supabase
      .from('onboarding_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (fetchError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if submission already exists
    if (session.submission_id) {
      return NextResponse.json(
        { error: 'Submission already exists for this session' },
        { status: 409 }
      );
    }

    // Validate required fields - business_name is required (from Step 3)
    if (!session.form_data.businessName) {
      return NextResponse.json(
        { error: 'Business name is required. Please complete Step 3.' },
        { status: 400 }
      );
    }

    // Calculate completion time
    const sessionCreatedAt = new Date(session.created_at);
    const now = new Date();
    const completionTimeSeconds = Math.floor((now.getTime() - sessionCreatedAt.getTime()) / 1000);

    // Create submission
    const { data: submission, error: createError } = await supabase
      .from('onboarding_submissions')
      .insert({
        session_id: sessionId,
        email: session.email,
        business_name: session.form_data.businessName,
        form_data: session.form_data,
        status: 'unpaid',
        completion_time_seconds: completionTimeSeconds
      })
      .select()
      .single();

    if (createError || !submission) {
      console.error('Failed to create submission:', createError);
      return NextResponse.json(
        { error: 'Failed to create submission' },
        { status: 500 }
      );
    }

    // Link submission to session
    const { error: updateError } = await supabase
      .from('onboarding_sessions')
      .update({
        submission_id: submission.id,
        last_activity: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Failed to link submission to session:', updateError);
      // Don't fail the request - submission was created successfully
    }

    return NextResponse.json(
      {
        success: true,
        submission
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Submit API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
