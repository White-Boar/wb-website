/**
 * API Route: POST /api/onboarding/save
 * Saves step form data to session
 */

import { NextRequest, NextResponse } from 'next/server';
import { createTestClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, formData } = body;

    if (!sessionId || !formData) {
      return NextResponse.json(
        { error: 'sessionId and formData are required' },
        { status: 400 }
      );
    }

    const supabase = createTestClient();

    // Get existing session
    const { data: session, error: fetchError } = await supabase
      .from('onboarding_sessions')
      .select('form_data')
      .eq('id', sessionId)
      .single();

    if (fetchError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Merge new form data with existing (shallow merge at top level)
    const mergedFormData = {
      ...session.form_data,
      ...formData
    };

    // Update session with merged data
    const { data: updatedSession, error: updateError } = await supabase
      .from('onboarding_sessions')
      .update({
        form_data: mergedFormData,
        last_activity: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (updateError || !updatedSession) {
      return NextResponse.json(
        { error: 'Failed to save form data' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        session: updatedSession
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Save API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
