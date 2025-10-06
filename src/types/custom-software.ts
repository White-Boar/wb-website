// =============================================================================
// CUSTOM SOFTWARE TYPES
// =============================================================================

export interface CustomSoftwareFormData {
  name: string
  email: string
  phone: string
  description: string
}

export interface CustomSoftwareApiResponse {
  success: boolean
  error?: string
  message?: string
}

export interface CustomSoftwareFormErrors {
  name?: string
  email?: string
  phone?: string
  description?: string
  submit?: string
}

export interface CustomSoftwareFormState {
  isSubmitting: boolean
  isSuccess: boolean
  errors: CustomSoftwareFormErrors
}
