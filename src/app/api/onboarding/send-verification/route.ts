import { NextRequest, NextResponse } from 'next/server'
import { OnboardingServerService } from '@/services/onboarding-server'
import { EmailService } from '@/services/resend'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, email, name, locale = 'en' } = await request.json()

    if (!sessionId || !email) {
      return NextResponse.json(
        { error: 'Session ID and email are required' },
        { status: 400 }
      )
    }

    // Generate verification code
    const verificationCode = await OnboardingService.generateVerificationCode(sessionId, email)

    // Send email via Resend
    const emailResult = await EmailService.sendVerificationEmail(
      email,
      name || 'User',
      verificationCode,
      locale
    )

    if (emailResult.success) {
      return NextResponse.json({
        success: true,
        message: 'Verification code sent successfully'
      })
    } else {
      console.error('Failed to send verification email:', emailResult.error)
      return NextResponse.json(
        {
          error: 'Failed to send verification email',
          details: emailResult.error
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Send verification API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}