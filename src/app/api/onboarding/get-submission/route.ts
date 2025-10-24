import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Get submission for this session
    const { data: submission, error } = await supabase
      .from('onboarding_submissions')
      .select('id')
      .eq('session_id', sessionId)
      .eq('status', 'submitted')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !submission) {
      return NextResponse.json(
        { error: 'No submission found for this session', submissionId: null },
        { status: 404 }
      )
    }

    return NextResponse.json({
      submissionId: submission.id
    })
  } catch (error) {
    console.error('Get submission API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
