/**
 * API Route: POST /api/onboarding/email/verify
 * Generates and sends OTP for email verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { createTestClient } from '@/lib/supabase/server';

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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

    // Check if locked out
    if (session.verification_locked_until) {
      const lockoutTime = new Date(session.verification_locked_until);
      const now = new Date();
      if (lockoutTime > now) {
        return NextResponse.json(
          {
            error: 'Too many failed attempts. Please try again later.',
            locked_until: session.verification_locked_until
          },
          { status: 429 }
        );
      }
    }

    // Generate OTP
    const otp = generateOTP();

    // Update session with OTP (updated_at will be used for 60-second expiry check)
    const { error: updateError } = await supabase
      .from('onboarding_sessions')
      .update({
        verification_code: otp,
        verification_attempts: 0, // Reset attempts on new OTP
        verification_locked_until: null,
        last_activity: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to generate verification code' },
        { status: 500 }
      );
    }

    // TODO: Send email with OTP (will implement email service separately)
    console.log(`[VERIFY] OTP for ${session.email}: ${otp} (expires in 60 seconds)`);
    console.log(`[VERIFY] For testing, use bypass code "123456" in dev/test environments`);

    return NextResponse.json(
      {
        success: true,
        message: 'Verification code sent to your email'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Email verify API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
