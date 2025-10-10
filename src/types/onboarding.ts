/**
 * Onboarding System v3 - TypeScript Type Definitions
 *
 * This file contains all TypeScript types for the onboarding feature.
 * Types match the data model defined in specs/001-onboarding-v3-implementation/data-model.md
 */

// ============================================================================
// Session State (Zustand Store)
// ============================================================================

/**
 * Session metadata stored in Zustand with localStorage persistence.
 * IMPORTANT: This should ONLY contain metadata, not form data.
 * Form data belongs in React Hook Form.
 */
export interface SessionState {
  sessionId: string | null;
  currentStep: number; // 1-13
  lastSaved: string | null; // ISO 8601 timestamp
}

// ============================================================================
// Form Data Types
// ============================================================================

/**
 * Complete form data structure.
 * Uses flat field naming (no nested objects).
 * Matches the form_data JSONB structure in the database.
 */
export interface OnboardingFormData {
  // Step 1 - Personal Information
  firstName?: string;
  lastName?: string;
  email?: string;

  // Step 3 - Business Basics
  businessName?: string;
  businessEmail?: string;
  businessPhone?: string;
  physicalAddressStreet?: string;
  physicalAddressCity?: string;
  physicalAddressProvince?: string;
  physicalAddressPostalCode?: string;
  physicalAddressCountry?: string;
  physicalAddressPlaceId?: string;
  industry?: string;
  vatNumber?: string;

  // Step 4 - Brand Definition
  businessDescription?: string;
  competitorUrls?: string[];
  competitorAnalysis?: string;

  // Step 5 - Customer Profile (sliders 0-100)
  customerProfileBudget?: number;
  customerProfileStyle?: number;
  customerProfileMotivation?: number;
  customerProfileDecisionMaking?: number;
  customerProfileLoyalty?: number;

  // Step 6 - Customer Needs
  customerProblems?: string;
  customerDelight?: string;

  // Step 7 - Visual Inspiration
  websiteReferences?: string[];

  // Step 8 - Design Style
  designStyle?: 'minimalist' | 'corporate' | 'bold' | 'playful' | 'editorial' | 'retro';

  // Step 9 - Image Style
  imageStyle?: 'photorealistic' | 'flat-illustration' | 'line-art' | 'sketch' | 'collage' | '3d';

  // Step 10 - Color Palette
  colorPalette?: string;

  // Step 11 - Website Structure
  websiteSections?: string[];
  primaryGoal?: 'generate_calls' | 'collect_forms' | 'drive_visits' | 'sell_products' | 'other';
  offeringType?: 'products' | 'services' | 'both';
  offerings?: string[];

  // Step 12 - Business Assets
  logoUploadId?: string;
  photoUploadIds?: string[];
}

// ============================================================================
// Submission Types
// ============================================================================

export type SubmissionStatus = 'unpaid' | 'paid' | 'preview_sent' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'succeeded' | 'failed';

export interface Submission {
  id: string;
  sessionId: string;
  email: string;
  businessName: string;
  formData: OnboardingFormData;
  status: SubmissionStatus;
  paymentTransactionId?: string;
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentCardLast4?: string;
  paymentStatus?: PaymentStatus;
  paymentCompletedAt?: string;
  completionTimeSeconds?: number;
  previewSentAt?: string;
  previewViewedAt?: string;
  adminNotes?: string;
  createdAt: string;
}

// ============================================================================
// Analytics Types
// ============================================================================

export type AnalyticsEventType =
  | 'onboarding_step_viewed'
  | 'onboarding_step_completed'
  | 'onboarding_field_error'
  | 'onboarding_form_submitted'
  | 'onboarding_payment_initiated'
  | 'onboarding_payment_succeeded'
  | 'onboarding_payment_failed'
  | 'onboarding_payment_retried'
  | 'onboarding_completed'
  | 'onboarding_abandoned'
  | 'onboarding_session_resumed'
  | 'onboarding_unpaid_followup';

export type AnalyticsEventCategory = 'user_action' | 'system_event' | 'error' | 'performance';

export interface AnalyticsEvent {
  id: string;
  sessionId?: string;
  eventType: AnalyticsEventType;
  category: AnalyticsEventCategory;
  stepNumber?: number;
  fieldName?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// ============================================================================
// Upload Types
// ============================================================================

export type FileType = 'logo' | 'photo';
export type VirusScanStatus = 'pending' | 'clean' | 'infected' | 'failed';

export interface Upload {
  id: string;
  sessionId: string;
  fileType: FileType;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
  uploadCompleted: boolean;
  virusScanStatus: VirusScanStatus;
  isProcessed: boolean;
  createdAt: string;
}
