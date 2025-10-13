/**
 * API Route: POST /api/onboarding/email/verify/confirm
 * Confirms OTP and marks email as verified
 */

import { NextRequest, NextResponse } from 'next/server';
import { createTestClient } from '@/lib/supabase/server';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, code } = body;

    if (!sessionId || !code) {
      return NextResponse.json(
        { error: 'sessionId and code are required' },
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

    // Check if already verified
    if (session.email_verified) {
      return NextResponse.json(
        { error: 'Email already verified' },
        { status: 400 }
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

    // Check if code exists
    if (!session.verification_code) {
      return NextResponse.json(
        { error: 'No verification code found. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check if code expired (60 seconds from updated_at)
    const updatedAt = new Date(session.updated_at);
    const now = new Date();
    const secondsSinceGeneration = (now.getTime() - updatedAt.getTime()) / 1000;

    if (secondsSinceGeneration > 60) {
      return NextResponse.json(
        { error: 'Verification code expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // SECURITY: Allow bypass code "123456" in dev/test environments only
    const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
    const isBypassCode = code === '123456' && isDevelopment;

    // Verify code
    if (!isBypassCode && session.verification_code !== code) {
      // Increment attempts
      const newAttempts = (session.verification_attempts || 0) + 1;

      // Check if should lock out
      if (newAttempts >= MAX_ATTEMPTS) {
        const lockoutUntil = new Date();
        lockoutUntil.setMinutes(lockoutUntil.getMinutes() + LOCKOUT_DURATION_MINUTES);

        await supabase
          .from('onboarding_sessions')
          .update({
            verification_attempts: newAttempts,
            verification_locked_until: lockoutUntil.toISOString(),
            last_activity: new Date().toISOString()
          })
          .eq('id', sessionId);

        return NextResponse.json(
          {
            error: 'Too many failed attempts. Please try again in 15 minutes.',
            locked_until: lockoutUntil.toISOString()
          },
          { status: 429 }
        );
      }

      // Just increment attempts
      await supabase
        .from('onboarding_sessions')
        .update({
          verification_attempts: newAttempts,
          last_activity: new Date().toISOString()
        })
        .eq('id', sessionId);

      return NextResponse.json(
        {
          error: 'Invalid verification code',
          attempts_remaining: MAX_ATTEMPTS - newAttempts
        },
        { status: 400 }
      );
    }

    // Code is correct - mark as verified
    const { data: updatedSession, error: updateError } = await supabase
      .from('onboarding_sessions')
      .update({
        email_verified: true,
        verification_code: null,
        verification_attempts: 0,
        verification_locked_until: null,
        last_activity: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (updateError || !updatedSession) {
      return NextResponse.json(
        { error: 'Failed to verify email' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Email verified successfully',
        session: updatedSession
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Email verify confirm API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
