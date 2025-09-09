// WhiteBoar Onboarding System - Core Type Definitions

// =============================================================================
// FORM DATA TYPES - Represents the complete onboarding form structure
// =============================================================================

export interface OnboardingFormData {
  // Step 1: Welcome & Basic Info
  name: string
  email: string
  
  // Step 2: Email Verification (handled separately)
  emailVerified: boolean
  
  // Step 3: Business Basics
  businessName: string
  businessEmail: string
  businessPhone: string
  physicalAddress: {
    street: string
    city: string
    province: string
    postalCode: string
    country: string
    placeId?: string // Google Places ID
  }
  industry: string
  vatNumber?: string
  
  // Step 4: Brand Definition
  offer: string
  competitors: string[] // URLs to competitor websites (1-3)
  uniqueness: {
    attribute: string // Dropdown selection
    explanation: string // Text completion
  }
  
  // Step 5: Customer Profile (5 sliders, 0-100 scale)
  customerProfile: {
    budget: number // Budget-Conscious (0) ↔ Premium (100)
    style: number // Traditional (0) ↔ Modern (100)
    motivation: number // Practical Solutions (0) ↔ Experience (100)
    decisionMaking: number // Spontaneous (0) ↔ Researches Thoroughly (100)
    loyalty: number // Price-Driven (0) ↔ Brand-Loyal (100)
  }
  
  // Step 6: Customer Needs
  problemSolved: string
  customerDelight: string
  
  // Step 7: Visual Inspiration
  websiteReferences: string[] // URLs (2-3)
  
  // Step 8: Design Style Selection
  designStyle: DesignStyleOption
  
  // Step 9: Image Style Selection
  imageStyle: ImageStyleOption
  
  // Step 10: Color Palette
  colorPalette: ColorPaletteOption
  
  // Step 11: Website Structure
  websiteSections: WebsiteSection[]
  primaryGoal: PrimaryGoal
  offeringType?: 'products' | 'services' | 'both' // Conditional on sections
  offerings?: string[] // Dynamic list (1-6 items)
  
  // Step 12: Business Assets
  logoUpload?: UploadedFile
  businessPhotos?: UploadedFile[]
  
  // Step 13: Completion (metadata)
  completedAt?: string
  totalTimeSeconds?: number
}

// =============================================================================
// STEP-SPECIFIC TYPES
// =============================================================================

export type DesignStyleOption = 
  | 'minimalist'
  | 'corporate' 
  | 'playful'
  | 'bold'
  | 'editorial'
  | 'retro'

export type ImageStyleOption =
  | 'photorealistic'
  | 'flat-illustration'
  | 'line-art'
  | 'sketch'
  | 'collage'
  | '3d'

export type ColorPaletteOption =
  | 'palette-1'
  | 'palette-2'
  | 'palette-3'
  | 'palette-4'
  | 'palette-5'
  | 'palette-6'

export type WebsiteSection = 
  | 'about-us'
  | 'products-services'
  | 'testimonials'
  | 'gallery'
  | 'events'
  | 'contact'
  | 'blog-news'

export type PrimaryGoal = 
  | 'call-book'
  | 'contact-form'
  | 'visit-location'
  | 'purchase'
  | 'download'
  | 'other'

export interface UploadedFile {
  id: string
  fileName: string
  fileSize: number
  mimeType: string
  url: string
  width?: number
  height?: number
  uploadedAt: string
}

// =============================================================================
// SESSION MANAGEMENT TYPES
// =============================================================================

export interface OnboardingSession {
  id: string
  email: string
  currentStep: number
  formData: Partial<OnboardingFormData>
  lastActivity: string
  expiresAt: string
  createdAt: string
  updatedAt: string
  emailVerified: boolean
  verificationCode?: string
  verificationAttempts: number
  verificationLockedUntil?: string
  ipAddress?: string
  userAgent?: string
  locale: 'en' | 'it'
}

export interface OnboardingSubmission {
  id: string
  sessionId?: string
  email: string
  businessName: string
  formData: OnboardingFormData
  previewSentAt?: string
  previewViewedAt?: string
  paymentCompletedAt?: string
  completionTimeSeconds?: number
  createdAt: string
  adminNotes?: string
  status: SubmissionStatus
}

export type SubmissionStatus = 
  | 'submitted'
  | 'preview_sent'
  | 'paid'
  | 'completed'
  | 'cancelled'

// =============================================================================
// ANALYTICS & TRACKING TYPES
// =============================================================================

export interface AnalyticsEvent {
  id: string
  sessionId?: string
  eventType: AnalyticsEventType
  stepNumber?: number
  fieldName?: string
  metadata: Record<string, any>
  createdAt: string
  category: AnalyticsCategory
  durationMs?: number
  ipAddress?: string
  userAgent?: string
}

export type AnalyticsEventType =
  | 'step_view'
  | 'step_complete'
  | 'field_error'
  | 'field_blur'
  | 'field_focus'
  | 'form_submit'
  | 'form_error'
  | 'session_start'
  | 'session_abandon'
  | 'email_verification_sent'
  | 'email_verification_success'
  | 'email_verification_failed'
  | 'file_upload_start'
  | 'file_upload_success'
  | 'file_upload_error'
  | 'navigation_back'
  | 'navigation_forward'
  | 'auto_save'
  | 'manual_save'
  | 'session_expired'
  | 'session_recovered'

export type AnalyticsCategory = 
  | 'user_action'
  | 'system_event'
  | 'error'
  | 'performance'

// =============================================================================
// VALIDATION TYPES
// =============================================================================

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface StepValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings?: ValidationError[]
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    message: string
    code: string
    details?: any
  }
}

export interface SessionResponse extends ApiResponse<OnboardingSession> {}
export interface SubmissionResponse extends ApiResponse<OnboardingSubmission> {}

export interface EmailVerificationResponse extends ApiResponse<{
  sent: boolean
  attemptsRemaining: number
  lockedUntil?: string
}> {}

export interface FileUploadResponse extends ApiResponse<{
  fileId: string
  url: string
  fileName: string
  fileSize: number
}> {}

// =============================================================================
// STORE TYPES (Zustand)
// =============================================================================

export interface OnboardingStore {
  // State
  sessionId: string | null
  currentStep: number
  formData: Partial<OnboardingFormData>
  completedSteps: number[]
  lastSaved: Date | null
  isLoading: boolean
  error: string | null
  
  // Validation state
  stepErrors: Record<number, ValidationError[]>
  isDirty: boolean
  
  // Session management
  isSessionExpired: boolean
  sessionExpiresAt: string | null
  
  // Actions
  initSession: (sessionId: string) => Promise<void>
  updateFormData: (stepData: Partial<OnboardingFormData>) => void
  setCurrentStep: (step: number) => void
  markStepComplete: (step: number) => void
  nextStep: () => void
  previousStep: () => void
  saveProgress: () => Promise<void>
  loadSession: (sessionId: string) => Promise<void>
  clearSession: () => void
  
  // Validation actions
  validateStep: (step: number) => Promise<StepValidationResult>
  setStepErrors: (step: number, errors: ValidationError[]) => void
  clearErrors: () => void
  
  // Session recovery
  recoverSession: () => Promise<boolean>
  refreshSession: () => Promise<void>
}

// =============================================================================
// COMPONENT PROPS TYPES
// =============================================================================

export interface StepProps {
  stepNumber: number
  title: string
  subtitle?: string
  onNext: (data: any) => void
  onBack: () => void
  isLoading?: boolean
}

export interface FormFieldProps {
  name: string
  label: string
  placeholder?: string
  required?: boolean
  helpText?: string
  error?: string
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type StepNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13

export interface StepConfig {
  number: StepNumber
  title: string
  subtitle?: string
  component: React.ComponentType<StepProps>
  validation?: any // Zod schema
  isSkippable?: boolean
  estimatedTime: number // in seconds
}

// Helper type for form data at specific steps
export type FormDataAtStep<T extends StepNumber> = 
  T extends 1 ? Pick<OnboardingFormData, 'name' | 'email'> :
  T extends 2 ? Pick<OnboardingFormData, 'emailVerified'> :
  T extends 3 ? Pick<OnboardingFormData, 'businessName' | 'businessEmail' | 'businessPhone' | 'physicalAddress' | 'industry' | 'vatNumber'> :
  T extends 4 ? Pick<OnboardingFormData, 'offer' | 'competitors' | 'uniqueness'> :
  T extends 5 ? Pick<OnboardingFormData, 'customerProfile'> :
  T extends 6 ? Pick<OnboardingFormData, 'problemSolved' | 'customerDelight'> :
  T extends 7 ? Pick<OnboardingFormData, 'websiteReferences'> :
  T extends 8 ? Pick<OnboardingFormData, 'designStyle'> :
  T extends 9 ? Pick<OnboardingFormData, 'imageStyle'> :
  T extends 10 ? Pick<OnboardingFormData, 'colorPalette'> :
  T extends 11 ? Pick<OnboardingFormData, 'websiteSections' | 'primaryGoal' | 'offeringType' | 'offerings'> :
  T extends 12 ? Pick<OnboardingFormData, 'logoUpload' | 'businessPhotos'> :
  T extends 13 ? Pick<OnboardingFormData, 'completedAt' | 'totalTimeSeconds'> :
  never

// =============================================================================
// CONSTANTS
// =============================================================================

export const TOTAL_STEPS = 13 as const
export const VERIFICATION_CODE_LENGTH = 6 as const
export const MAX_VERIFICATION_ATTEMPTS = 5 as const
export const VERIFICATION_LOCKOUT_MINUTES = 15 as const
export const SESSION_DURATION_DAYS = 7 as const