/**
 * API Routes: GET/PATCH /api/onboarding/session/[sessionId]
 * Load and update onboarding session by ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { createTestClient } from '@/lib/supabase/server';

type RouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { sessionId } = await params;

    const supabase = createTestClient();
    const { data: session, error } = await supabase
      .from('onboarding_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if session is expired
    const now = new Date();
    const expiresAt = new Date(session.expires_at);

    if (expiresAt < now) {
      return NextResponse.json(
        { error: 'Session has expired' },
        { status: 410 }
      );
    }

    return NextResponse.json(
      { session },
      { status: 200 }
    );
  } catch (error) {
    console.error('Session load error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { sessionId } = await params;
    const body = await request.json();

    // Validate current_step if provided
    if (body.current_step !== undefined) {
      if (body.current_step < 1 || body.current_step > 13) {
        return NextResponse.json(
          { error: 'current_step must be between 1 and 13' },
          { status: 400 }
        );
      }
    }

    // Build update object with only allowed fields
    const updates: Record<string, any> = {};
    if (body.current_step !== undefined) updates.current_step = body.current_step;
    if (body.locale !== undefined) updates.locale = body.locale;
    if (body.email_verified !== undefined) updates.email_verified = body.email_verified;

    // Update last_activity timestamp
    updates.last_activity = new Date().toISOString();

    const supabase = createTestClient();
    const { data: session, error } = await supabase
      .from('onboarding_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();

    if (error || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { session },
      { status: 200 }
    );
  } catch (error) {
    console.error('Session update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
