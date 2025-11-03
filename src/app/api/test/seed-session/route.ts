import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Test-only API endpoint to seed a pre-filled onboarding session
 * This allows E2E tests to jump directly to Step 14 without navigating through all steps
 *
 * SECURITY: Only enabled in test/development environments
 */
export async function POST(request: NextRequest) {
  // CRITICAL: Only allow in test/development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test endpoints disabled in production' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const {
      email,
      locale = 'en',
      currentStep = 14,
      additionalLanguages = []
    } = body

    // Use service role key for test data creation
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Generate test email if not provided
    const testEmail = email || `test-step14-${Date.now()}@example.com`

    // Create session with pre-filled data
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

    // Realistic form data that passes all validations
    const formData = {
      // Step 1
      firstName: 'Test',
      lastName: 'User',
      email: testEmail,

      // Step 2
      emailVerified: true,

      // Step 3
      businessName: 'Test Business Inc',
      industry: 'technology-and-it-services',
      businessPhone: '320 123 4567',
      businessEmail: 'business@test.com',
      businessStreet: 'Via Test 123',
      businessCity: 'Milano',
      businessPostalCode: '20123',
      businessProvince: 'MI',
      businessCountry: 'Italy',
      vatNumber: 'IT12345678901',

      // Step 4
      businessDescription: 'A comprehensive test business providing innovative solutions for automated testing and quality assurance in modern web applications.',
      competitorUrls: ['https://example.com'],
      competitorAnalysis: 'Competitor analysis for testing purposes',

      // Step 5
      customerProfile: {
        budget: 50,
        style: 50,
        motivation: 50,
        decisionMaking: 50,
        loyalty: 50
      },

      // Step 6
      customerProblems: 'Testing customer problems and pain points that need to be addressed',
      customerDelight: 'Testing customer delight factors',

      // Step 7
      websiteReferences: [],

      // Step 8
      designStyle: 'minimalist',

      // Step 9
      imageStyle: 'photorealistic',

      // Step 10
      colorPalette: 'professional-blue',

      // Step 11
      websiteSections: ['about', 'services', 'contact'],
      primaryGoal: 'generate-leads',
      offeringType: 'services',
      offerings: ['Consulting Services', 'Technical Support'],

      // Step 12
      logoUpload: {
        name: 'test-logo.png',
        size: 1024,
        type: 'image/png',
        url: '/test/logo.png'
      },
      businessPhotos: [],

      // Step 13
      additionalLanguages: additionalLanguages
    }

    // 1. Create session
    const { data: session, error: sessionError } = await supabase
      .from('onboarding_sessions')
      .insert({
        email: testEmail,
        current_step: currentStep,
        form_data: formData,
        expires_at: expiresAt.toISOString(),
        locale,
        email_verified: true,
        verification_attempts: 0
      })
      .select()
      .single()

    if (sessionError || !session) {
      console.error('Session creation error:', sessionError)
      return NextResponse.json(
        { error: `Failed to create session: ${sessionError?.message}` },
        { status: 500 }
      )
    }

    // 2. Create submission (required for Step 14)
    const { data: submission, error: submissionError} = await supabase
      .from('onboarding_submissions')
      .insert({
        session_id: session.id,
        email: testEmail,
        business_name: formData.businessName || 'Test Business Inc',
        form_data: formData,
        completion_time_seconds: 60, // Mock completion time
        status: 'submitted'
      })
      .select()
      .single()

    if (submissionError || !submission) {
      console.error('Submission creation error:', submissionError)
      // Clean up session if submission fails
      await supabase
        .from('onboarding_sessions')
        .delete()
        .eq('id', session.id)

      return NextResponse.json(
        { error: `Failed to create submission: ${submissionError?.message}` },
        { status: 500 }
      )
    }

    // Return session details
    const localePath = locale === 'en' ? 'en' : 'it'

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      submissionId: submission.id,
      email: testEmail,
      formData: formData, // For localStorage injection
      url: `/${localePath}/onboarding/step/${currentStep}`
    })

  } catch (error) {
    console.error('Seed session error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
