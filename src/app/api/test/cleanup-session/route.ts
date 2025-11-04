import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  // CRITICAL: Only allow in development and preview environments, block in production
  // VERCEL_ENV is 'production', 'preview', or 'development'
  if (process.env.VERCEL_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'Test cleanup endpoint disabled in production' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const sessionId = body?.sessionId as string | undefined
    const submissionId = body?.submissionId as string | undefined

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'sessionId is required' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Missing Supabase credentials' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (submissionId) {
      await supabase
        .from('onboarding_submissions')
        .delete()
        .eq('id', submissionId)
    }

    await supabase
      .from('onboarding_uploads')
      .delete()
      .eq('session_id', sessionId)

    await supabase
      .from('onboarding_analytics')
      .delete()
      .eq('session_id', sessionId)

    await supabase
      .from('onboarding_sessions')
      .delete()
      .eq('id', sessionId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cleanup session error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
