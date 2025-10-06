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
    const verificationCode = await OnboardingServerService.generateVerificationCode(sessionId, email)

    // Skip sending emails during automated tests (detect by .test@ pattern)
    const isTestEmail = email.includes('.test@')

    if (isTestEmail) {
      console.log('Test email detected - skipping Resend API call:', email)
      return NextResponse.json({
        success: true,
        message: 'Verification code sent successfully (test mode)',
        testMode: true
      })
    }

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

    // Handle specific error cases with user-friendly messages
    if (error instanceof Error) {
      if (error.message.includes('already associated with a completed onboarding')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 } // Conflict
        )
      }

      if (error.message.includes('Failed to generate verification code')) {
        return NextResponse.json(
          { error: 'Unable to send verification code. Please try again or use a different email address.' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}