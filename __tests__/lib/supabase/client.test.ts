/**
 * Test: Supabase Client Configuration
 *
 * Verifies that both server and client Supabase clients are properly
 * configured for onboarding API routes.
 */

import { createServerClient, createTestClient } from '@/lib/supabase/server';
import { createBrowserClient } from '@/lib/supabase/client';

describe('Supabase Client Configuration', () => {
  describe('Server Client', () => {
    it('should export createServerClient function', () => {
      expect(typeof createServerClient).toBe('function');
    });

    it('should export createTestClient function', () => {
      expect(typeof createTestClient).toBe('function');
    });

    it('should create test client with proper configuration', () => {
      const client = createTestClient();

      expect(client).toBeDefined();
      expect(client.auth).toBeDefined();
      expect(client.from).toBeDefined();
    });

    it('should be able to query onboarding_sessions table', async () => {
      const client = createTestClient();

      const { data, error} = await client
        .from('onboarding_sessions')
        .select('*')
        .limit(1);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('Browser Client', () => {
    it('should export createBrowserClient function', () => {
      expect(typeof createBrowserClient).toBe('function');
    });

    it('should create client with proper configuration', () => {
      const client = createBrowserClient();

      expect(client).toBeDefined();
      expect(client.auth).toBeDefined();
      expect(client.from).toBeDefined();
    });
  });

  describe('Session Ownership Verification', () => {
    it('should have verifySessionOwnership helper function', async () => {
      const { verifySessionOwnership } = await import('@/lib/supabase/server');

      expect(typeof verifySessionOwnership).toBe('function');
    });

    it('should verify session ownership correctly', async () => {
      const { verifySessionOwnership } = await import('@/lib/supabase/server');
      const client = createTestClient();

      // Create a test session
      const { data: session } = await client
        .from('onboarding_sessions')
        .insert({
          email: `test-ownership-${Date.now()}@test.com`
        })
        .select()
        .single();

      // Verify ownership (should return data for valid session)
      const result = await verifySessionOwnership(session!.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(session!.id);

      // Cleanup
      await client
        .from('onboarding_sessions')
        .delete()
        .eq('id', session!.id);
    });
  });

  describe('Environment Variables', () => {
    it('should have NEXT_PUBLIC_SUPABASE_URL configured', () => {
      expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
      expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toContain('supabase.co');
    });

    it('should have NEXT_PUBLIC_SUPABASE_ANON_KEY configured', () => {
      expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined();
      expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length).toBeGreaterThan(0);
    });

    it('should have SUPABASE_SERVICE_ROLE_KEY configured', () => {
      expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeDefined();
      expect(process.env.SUPABASE_SERVICE_ROLE_KEY?.length).toBeGreaterThan(0);
    });
  });

  describe('TypeScript Types', () => {
    it('should properly infer types from database schema', async () => {
      const client = createTestClient();

      // Query should have proper type inference
      const { data } = await client
        .from('onboarding_sessions')
        .select('id, email, current_step')
        .limit(1)
        .single();

      if (data) {
        // These should not cause TypeScript errors
        expect(typeof data.id).toBe('string');
        expect(typeof data.current_step).toBe('number');
      }
    });
  });
});
