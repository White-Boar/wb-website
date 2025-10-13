import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

/**
 * Create a Supabase client for use in Server Components and Route Handlers.
 * Uses the service_role key for elevated permissions.
 *
 * @returns Supabase client configured for server-side use with cookies
 */
export async function createServerClient() {
  const cookieStore = await cookies()

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Create a Supabase client for use in tests.
 * Does not use cookies and connects directly with service_role key.
 *
 * @returns Supabase client for testing
 */
export function createTestClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Verify that the current user has access to the specified session.
 *
 * For now, this uses service_role which has full access.
 * In production, this should validate based on session cookies or JWT.
 *
 * @param sessionId - The session ID to verify access for
 * @returns Session data if accessible, null if not found
 */
export async function verifySessionOwnership(sessionId: string) {
  // Use test client in test environment to avoid cookies() dependency
  const client = process.env.NODE_ENV === 'test'
    ? createTestClient()
    : await createServerClient()

  const { data, error } = await client
    .from('onboarding_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error || !data) {
    return null
  }

  return data
}
