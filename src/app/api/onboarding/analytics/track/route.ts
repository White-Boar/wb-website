import { NextRequest, NextResponse } from 'next/server'
import { OnboardingServerService } from '@/services/onboarding-server'
import { AnalyticsEventType } from '@/types/onboarding'

export async function POST(request: NextRequest) {
  try {
    const {
      sessionId,
      eventType,
      metadata = {},
      stepNumber,
      fieldName,
      category = 'user_action',
      durationMs
    }: {
      sessionId: string
      eventType: AnalyticsEventType
      metadata?: Record<string, any>
      stepNumber?: number
      fieldName?: string
      category?: string
      durationMs?: number
    } = await request.json()

    if (!sessionId || !eventType) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, eventType' },
        { status: 400 }
      )
    }

    // Add request context to metadata
    const enrichedMetadata = {
      ...metadata,
      ip_address: request.headers.get('x-forwarded-for') ||
                  request.headers.get('x-real-ip') ||
                  'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      timestamp: new Date().toISOString()
    }

    // Track event using server service (service role)
    await OnboardingServerService.trackEvent(
      sessionId,
      eventType,
      enrichedMetadata,
      stepNumber,
      fieldName,
      category,
      durationMs
    )

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Analytics tracking error:', error)

    // Don't expose internal errors to client
    return NextResponse.json(
      { error: 'Failed to track analytics event' },
      { status: 500 }
    )
  }
}