import { createClient } from '@supabase/supabase-js'

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL')
}

if (!supabaseAnonKey) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Create Supabase client for client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
})

// Server-side client with service role key (for API routes only)
export const createServiceClient = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceKey) {
    throw new Error('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY')
  }
  
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Database table type definitions for better type safety
export type Database = {
  public: {
    Tables: {
      onboarding_sessions: {
        Row: {
          id: string
          email: string
          current_step: number
          form_data: Record<string, any>
          last_activity: string
          expires_at: string
          created_at: string
          updated_at: string
          email_verified: boolean
          verification_code: string | null
          verification_attempts: number
          verification_locked_until: string | null
          ip_address: string | null
          user_agent: string | null
          locale: string
        }
        Insert: {
          id?: string
          email: string
          current_step?: number
          form_data?: Record<string, any>
          last_activity?: string
          expires_at?: string
          created_at?: string
          updated_at?: string
          email_verified?: boolean
          verification_code?: string | null
          verification_attempts?: number
          verification_locked_until?: string | null
          ip_address?: string | null
          user_agent?: string | null
          locale?: string
        }
        Update: {
          id?: string
          email?: string
          current_step?: number
          form_data?: Record<string, any>
          last_activity?: string
          expires_at?: string
          created_at?: string
          updated_at?: string
          email_verified?: boolean
          verification_code?: string | null
          verification_attempts?: number
          verification_locked_until?: string | null
          ip_address?: string | null
          user_agent?: string | null
          locale?: string
        }
      }
      onboarding_submissions: {
        Row: {
          id: string
          session_id: string | null
          email: string
          business_name: string
          form_data: Record<string, any>
          preview_sent_at: string | null
          preview_viewed_at: string | null
          payment_completed_at: string | null
          completion_time_seconds: number | null
          created_at: string
          admin_notes: string | null
          status: string
        }
        Insert: {
          id?: string
          session_id?: string | null
          email: string
          business_name: string
          form_data: Record<string, any>
          preview_sent_at?: string | null
          preview_viewed_at?: string | null
          payment_completed_at?: string | null
          completion_time_seconds?: number | null
          created_at?: string
          admin_notes?: string | null
          status?: string
        }
        Update: {
          id?: string
          session_id?: string | null
          email?: string
          business_name?: string
          form_data?: Record<string, any>
          preview_sent_at?: string | null
          preview_viewed_at?: string | null
          payment_completed_at?: string | null
          completion_time_seconds?: number | null
          created_at?: string
          admin_notes?: string | null
          status?: string
        }
      }
      onboarding_analytics: {
        Row: {
          id: string
          session_id: string | null
          event_type: string
          step_number: number | null
          field_name: string | null
          metadata: Record<string, any>
          created_at: string
          category: string
          duration_ms: number | null
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          session_id?: string | null
          event_type: string
          step_number?: number | null
          field_name?: string | null
          metadata?: Record<string, any>
          created_at?: string
          category?: string
          duration_ms?: number | null
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: string
          session_id?: string | null
          event_type?: string
          step_number?: number | null
          field_name?: string | null
          metadata?: Record<string, any>
          created_at?: string
          category?: string
          duration_ms?: number | null
          ip_address?: string | null
          user_agent?: string | null
        }
      }
      onboarding_uploads: {
        Row: {
          id: string
          session_id: string | null
          file_type: string
          file_url: string
          file_name: string
          file_size: number
          mime_type: string
          width: number | null
          height: number | null
          upload_completed: boolean
          created_at: string
          virus_scan_status: string
          is_processed: boolean
        }
        Insert: {
          id?: string
          session_id?: string | null
          file_type: string
          file_url: string
          file_name: string
          file_size: number
          mime_type: string
          width?: number | null
          height?: number | null
          upload_completed?: boolean
          created_at?: string
          virus_scan_status?: string
          is_processed?: boolean
        }
        Update: {
          id?: string
          session_id?: string | null
          file_type?: string
          file_url?: string
          file_name?: string
          file_size?: number
          mime_type?: string
          width?: number | null
          height?: number | null
          upload_completed?: boolean
          created_at?: string
          virus_scan_status?: string
          is_processed?: boolean
        }
      }
    }
  }
}

// Type-safe client
export const typedSupabase = supabase as ReturnType<typeof createClient<Database>>