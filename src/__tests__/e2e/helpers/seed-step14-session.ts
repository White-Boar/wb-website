/**
 * Test helper to seed a pre-filled Step 14 session
 * Eliminates the need to navigate through all 14 steps in every test
 */

export interface SeedStep14Options {
  /** Additional languages to include in the session (e.g., ['de', 'fr']) */
  additionalLanguages?: string[]
  /** Custom email (auto-generated if not provided) */
  email?: string
  /** Locale (defaults to 'en') */
  locale?: 'en' | 'it'
}

export interface SeedStep14Result {
  /** Session ID */
  sessionId: string
  /** Submission ID (needed for cleanup) */
  submissionId: string
  /** Email used for the session */
  email: string
  /** Direct URL to Step 14 */
  url: string
  /** Zustand store JSON for localStorage injection */
  zustandStore: string
}

/**
 * Seed a pre-filled Step 14 test session
 *
 * @param options - Configuration options
 * @returns Session details including direct URL to Step 14
 *
 * @example
 * // Basic usage
 * const seed = await seedStep14TestSession()
 * await page.addInitScript((store) => {
 *   localStorage.setItem('wb-onboarding-store', store)
 * }, seed.zustandStore)
 * await page.goto(`http://localhost:3783${seed.url}`)
 *
 * @example
 * // With language add-ons
 * const seed = await seedStep14TestSession({ additionalLanguages: ['de', 'fr'] })
 * await page.addInitScript((store) => {
 *   localStorage.setItem('wb-onboarding-store', store)
 * }, seed.zustandStore)
 * await page.goto(`http://localhost:3783${seed.url}`)
 */
export async function seedStep14TestSession(
  options: SeedStep14Options = {}
): Promise<SeedStep14Result> {
  const response = await fetch('http://localhost:3783/api/test/seed-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: options.email,
      locale: options.locale || 'en',
      currentStep: 14,
      additionalLanguages: options.additionalLanguages || []
    })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(`Failed to seed Step 14 session: ${error.error || response.statusText}`)
  }

  const data = await response.json()

  if (!data.success) {
    throw new Error(`Seed session failed: ${data.error || 'Unknown error'}`)
  }

  // Build Zustand store structure matching persist config in onboarding.ts
  const zustandStore = {
    state: {
      sessionId: data.sessionId,
      currentStep: 14,
      completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
      formData: data.formData, // Full form data from seed API
      sessionExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      isSessionExpired: false
    },
    version: 1 // Must match version in onboarding.ts
  }

  return {
    sessionId: data.sessionId,
    submissionId: data.submissionId,
    email: data.email,
    url: data.url,
    zustandStore: JSON.stringify(zustandStore)
  }
}

/**
 * Clean up test session and submission from database
 *
 * @param sessionId - Session ID to clean up
 * @param submissionId - Submission ID to clean up
 *
 * @example
 * const { sessionId, submissionId } = await seedStep14TestSession()
 * try {
 *   // ... run tests
 * } finally {
 *   await cleanupTestSession(sessionId, submissionId)
 * }
 */
export async function cleanupTestSession(sessionId: string, submissionId?: string): Promise<void> {
  const { createClient } = await import('@supabase/supabase-js')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Cannot cleanup: Missing Supabase credentials')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Delete submission first (foreign key constraint)
  if (submissionId) {
    await supabase
      .from('onboarding_submissions')
      .delete()
      .eq('id', submissionId)
  }

  // Delete session
  await supabase
    .from('onboarding_sessions')
    .delete()
    .eq('id', sessionId)
}
