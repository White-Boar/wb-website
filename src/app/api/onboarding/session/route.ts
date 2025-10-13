/**
 * API Route: POST /api/onboarding/session
 * Creates a new onboarding session
 */

import { NextRequest, NextResponse } from 'next/server';
import { createTestClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { locale, email } = body;

    // Validate required fields
    if (!locale || !email) {
      return NextResponse.json(
        { error: 'locale and email are required' },
        { status: 400 }
      );
    }

    // Extract IP address and user agent from request headers
    const ip_address = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const user_agent = request.headers.get('user-agent') || 'unknown';

    // Calculate expires_at (7 days from now)
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + 7);

    // Create session in database
    const supabase = createTestClient();
    const { data: session, error } = await supabase
      .from('onboarding_sessions')
      .insert({
        email,
        locale,
        current_step: 1,
        form_data: {},
        ip_address,
        user_agent,
        expires_at: expires_at.toISOString(),
        email_verified: false,
        verification_code: null,
        verification_attempts: 0,
        verification_locked_until: null
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create session:', error);
      return NextResponse.json(
        { error: 'Failed to create session', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { session },
      { status: 201 }
    );
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
