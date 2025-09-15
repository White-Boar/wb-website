import { NextRequest, NextResponse } from 'next/server'
import { OnboardingServerService } from '@/services/onboarding-server'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, formData, completionTimeSeconds } = await request.json()

    if (!sessionId || !formData) {
      return NextResponse.json(
        { error: 'Session ID and form data are required' },
        { status: 400 }
      )
    }

    // Submit onboarding via server service (service role)
    const submission = await OnboardingServerService.submitOnboarding(
      sessionId,
      formData,
      completionTimeSeconds
    )

    return NextResponse.json({
      success: true,
      data: submission
    })

  } catch (error) {
    console.error('Submit onboarding API error:', error)
    return NextResponse.json(
      { error: 'Failed to submit onboarding' },
      { status: 500 }
    )
  }
}