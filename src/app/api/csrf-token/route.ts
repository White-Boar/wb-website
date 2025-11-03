import { NextRequest, NextResponse } from 'next/server'
import { generateCSRFToken } from '@/lib/csrf'
import { createServiceClient } from '@/lib/supabase'

/**
 * GET /api/csrf-token?sessionId=xxx
 * Generate a CSRF token for the given session
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session ID is required'
        },
        { status: 400 }
      )
    }

    const supabase = await createServiceClient()
    const { data: session, error } = await supabase
      .from('onboarding_sessions')
      .select('id, expires_at')
      .eq('id', sessionId)
      .single()

    if (error || !session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session not found'
        },
        { status: 404 }
      )
    }

    if (session.expires_at && new Date(session.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session has expired'
        },
        { status: 403 }
      )
    }

    const csrfToken = generateCSRFToken(sessionId)

    return NextResponse.json({
      success: true,
      token: csrfToken.token,
      expiresAt: csrfToken.expiresAt
    })
  } catch (error) {
    console.error('Failed to generate CSRF token:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate CSRF token'
      },
      { status: 500 }
    )
  }
}
