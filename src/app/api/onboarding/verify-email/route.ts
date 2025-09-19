import { NextRequest, NextResponse } from 'next/server'
import { OnboardingServerService } from '@/services/onboarding-server'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, code } = await request.json()

    if (!sessionId || !code) {
      return NextResponse.json(
        { error: 'Session ID and verification code are required' },
        { status: 400 }
      )
    }

    // Verify the code
    const result = await OnboardingServerService.verifyEmail(sessionId, code) as any

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Email verified successfully',
        attemptsRemaining: result.attemptsRemaining
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid verification code',
          attemptsRemaining: result.attemptsRemaining,
          lockedUntil: result.lockedUntil
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Verify email API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}