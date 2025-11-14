// =============================================================================
// CONTACT FORM TYPES
// =============================================================================

export interface ContactFormData {
  name: string
  email: string
  phone: string
  details: string
}

export interface ContactApiResponse {
  success: boolean
  error?: string
  message?: string
}

export interface ContactFormErrors {
  name?: string
  email?: string
  phone?: string
  details?: string
  submit?: string
}

export interface ContactFormState {
  isSubmitting: boolean
  isSuccess: boolean
  errors: ContactFormErrors
}
