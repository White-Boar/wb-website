import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

/**
 * GET /api/onboarding/status?session_id=xxx
 * Check the submission status for a given session ID
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Query the onboarding_submissions table for this session
    const { data: submission, error } = await supabase
      .from('onboarding_submissions')
      .select('status, payment_completed_at')
      .eq('session_id', sessionId)
      .single()

    if (error) {
      // If no submission found, return draft status
      if (error.code === 'PGRST116') {
        return NextResponse.json({ status: 'draft' })
      }

      console.error('Failed to fetch submission status:', error)
      return NextResponse.json(
        { error: 'Failed to fetch submission status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      status: submission.status || 'draft',
      payment_completed_at: submission.payment_completed_at
    })
  } catch (error) {
    console.error('Error checking submission status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
