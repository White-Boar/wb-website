import { NextRequest, NextResponse } from 'next/server'
import { generateCSRFToken } from '@/lib/csrf'

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
