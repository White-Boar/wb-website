import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { devtools } from 'zustand/middleware'
import debounce from 'lodash.debounce'
import { 
  OnboardingFormData, 
  OnboardingStore, 
  ValidationError, 
  StepValidationResult,
  OnboardingSession,
  TOTAL_STEPS
} from '@/types/onboarding'

// Initial form data structure
const initialFormData: Partial<OnboardingFormData> = {
  firstName: '',
  lastName: '',
  email: '',
  emailVerified: false,
  businessName: '',
  businessEmail: '',
  businessPhone: '',
  physicalAddress: {
    street: '',
    city: '',
    province: '',
    postalCode: '',
    country: '',
    placeId: undefined
  },
  industry: '',
  vatNumber: '',
  businessDescription: '',
  competitorUrls: [],
  competitorAnalysis: '',
  customerProfile: {
    budget: 50,
    style: 50,
    motivation: 50,
    decisionMaking: 50,
    loyalty: 50
  },
  customerProblems: '',
  customerDelight: '',
  websiteReferences: [],
  designStyle: undefined,
  imageStyle: undefined,
  colorPalette: undefined,
  websiteSections: [],
  primaryGoal: undefined,
  offeringType: undefined,
  offerings: [],
  logoUpload: undefined,
  businessPhotos: []
}

// Create debounced auto-save function
const createDebouncedSave = (saveFunction: () => Promise<void>) => 
  debounce(saveFunction, 2000, { leading: false, trailing: true })

export const useOnboardingStore = create<OnboardingStore>()(
  devtools(
    persist(
      (set, get) => {
        // Create debounced save function with access to store state
        let debouncedSaveProgress: ReturnType<typeof createDebouncedSave>
        
        const saveProgressToServer = async () => {
          const state = get()
          if (!state.sessionId) return

          try {
            set({ isLoading: true, error: null })
            
            // Import dynamically to avoid circular dependencies
            const { OnboardingClientService } = await import('@/services/onboarding-client')

            await OnboardingClientService.saveProgress(
              state.sessionId,
              state.formData,
              state.currentStep
            )
            
            set({ 
              lastSaved: new Date(),
              isDirty: false,
              isLoading: false 
            })
          } catch (error) {
            console.error('Failed to save progress:', error)
            set({ 
              error: error instanceof Error ? error.message : 'Failed to save progress',
              isLoading: false 
            })
          }
        }

        // Initialize debounced save
        debouncedSaveProgress = createDebouncedSave(saveProgressToServer)

        return {
          // Initial State
          sessionId: null,
          currentStep: 1,
          formData: initialFormData,
          completedSteps: [],
          lastSaved: null,
          isLoading: false,
          error: null,
          stepErrors: {},
          isDirty: false,
          isSessionExpired: false,
          sessionExpiresAt: null,

          // Session Management Actions
          initSession: async (sessionId: string) => {
            set({ isLoading: true, error: null })
            
            try {
              const { OnboardingClientService } = await import('@/services/onboarding-client')
              const session = await OnboardingClientService.getSession(sessionId)
              
              if (!session) {
                throw new Error('Session not found')
              }

              // Check if session is expired
              const isExpired = new Date(session.expiresAt) < new Date()
              
              set({
                sessionId: session.id,
                currentStep: session.currentStep && session.currentStep >= 1 ? session.currentStep : 1,
                formData: { ...initialFormData, ...session.formData },
                sessionExpiresAt: session.expiresAt,
                isSessionExpired: isExpired,
                lastSaved: new Date(session.updatedAt),
                isLoading: false,
                isDirty: false,
                completedSteps: Array.from(
                  { length: session.currentStep - 1 },
                  (_, i) => i + 1
                )
              })

              // Track session start time if not already tracked
              if (typeof window !== 'undefined' && !localStorage.getItem(`wb-onboarding-start-${session.id}`)) {
                localStorage.setItem(`wb-onboarding-start-${session.id}`, Date.now().toString())
              }
            } catch (error) {
              console.error('Failed to initialize session:', error)
              set({ 
                error: error instanceof Error ? error.message : 'Failed to initialize session',
                isLoading: false 
              })
            }
          },

          loadSession: async (sessionId: string) => {
            const { initSession } = get()
            await initSession(sessionId)
          },

          // Form Data Management
          updateFormData: (stepData: Partial<OnboardingFormData>) => {
            const currentData = get().formData
            const updatedData = { ...currentData, ...stepData }
            
            set({ 
              formData: updatedData,
              isDirty: true 
            })

            // Trigger auto-save
            debouncedSaveProgress()
          },

          // Step Navigation
          setCurrentStep: (step: number) => {
            if (step < 1 || step > TOTAL_STEPS) {
              console.warn(`Invalid step number: ${step}`)
              return
            }
            
            set({ currentStep: step, isDirty: true })
            debouncedSaveProgress()
          },

          nextStep: () => {
            const { currentStep } = get()
            if (currentStep < TOTAL_STEPS) {
              get().setCurrentStep(currentStep + 1)
            }
          },

          previousStep: () => {
            const { currentStep } = get()
            if (currentStep > 1) {
              get().setCurrentStep(currentStep - 1)
            }
          },

          markStepComplete: (step: number) => {
            const { completedSteps } = get()
            if (!completedSteps.includes(step)) {
              set({ 
                completedSteps: [...completedSteps, step].sort((a, b) => a - b),
                isDirty: true
              })
              debouncedSaveProgress()
            }
          },

          // Manual Save
          saveProgress: async () => {
            await saveProgressToServer()
          },

          // Session Recovery
          recoverSession: async () => {
            const sessionId = get().sessionId
            if (!sessionId) return false

            try {
              set({ isLoading: true })
              await get().loadSession(sessionId)
              return true
            } catch (error) {
              console.error('Session recovery failed:', error)
              set({ 
                error: 'Session recovery failed',
                isLoading: false 
              })
              return false
            }
          },

          refreshSession: async () => {
            const { sessionId } = get()
            if (!sessionId) return

            try {
              const { OnboardingClientService } = await import('@/services/onboarding-client')
              await OnboardingClientService.refreshSession(sessionId)

              // Extend expiration time
              const newExpiresAt = new Date()
              newExpiresAt.setDate(newExpiresAt.getDate() + 7)

              set({
                sessionExpiresAt: newExpiresAt.toISOString(),
                isSessionExpired: false
              })
            } catch (error) {
              console.error('Failed to refresh session:', error)
            }
          },

          checkSessionExpired: () => {
            const { sessionExpiresAt, sessionId } = get()

            if (!sessionId || !sessionExpiresAt) {
              return
            }

            const now = new Date()
            const expiresAt = new Date(sessionExpiresAt)

            if (now >= expiresAt) {
              set({ isSessionExpired: true })
            }
          },

          // Validation
          validateStep: async (step: number): Promise<StepValidationResult> => {
            const { formData } = get()
            
            try {
              // Import validation schema dynamically
              const { getStepSchema } = await import('@/schemas/onboarding')
              const schema = getStepSchema(step)
              
              if (!schema) {
                return { isValid: true, errors: [] }
              }

              // Extract relevant data for this step
              const stepData = extractStepData(formData, step)
              
              // Validate with Zod schema
              const result = schema.safeParse(stepData)
              
              if (result.success) {
                // Clear any existing errors for this step
                get().setStepErrors(step, [])
                return { isValid: true, errors: [] }
              } else {
                // Convert Zod errors to our format
                const errors: ValidationError[] = result.error.errors.map(err => ({
                  field: err.path.join('.'),
                  message: err.message,
                  code: err.code
                }))
                
                get().setStepErrors(step, errors)
                return { isValid: false, errors }
              }
            } catch (error) {
              console.error('Validation error:', error)
              return { 
                isValid: false, 
                errors: [{ field: 'general', message: 'Validation failed', code: 'validation_error' }] 
              }
            }
          },

          setStepErrors: (step: number, errors: ValidationError[]) => {
            const { stepErrors } = get()
            set({ 
              stepErrors: { 
                ...stepErrors, 
                [step]: errors 
              } 
            })
          },

          clearErrors: () => {
            set({ stepErrors: {}, error: null })
          },

          // Session Cleanup
          clearSession: () => {
            // Cancel any pending saves
            debouncedSaveProgress.cancel()

            // Get current session ID before clearing to clean up start time
            const currentSessionId = get().sessionId

            // First clear localStorage immediately
            if (typeof window !== 'undefined') {
              localStorage.removeItem('wb-onboarding-store')
              // Also clean up session start time
              if (currentSessionId) {
                localStorage.removeItem(`wb-onboarding-start-${currentSessionId}`)
              }
            }

            // Reset state to initial values
            set({
              sessionId: null,
              currentStep: 1,
              formData: initialFormData,
              completedSteps: [],
              lastSaved: null,
              isLoading: false,
              error: null,
              stepErrors: {},
              isDirty: false,
              isSessionExpired: false,
              sessionExpiresAt: null
            })

            // Clear localStorage again after state update to ensure it's really gone
            // Use multiple timeouts to handle any async persist operations
            if (typeof window !== 'undefined') {
              setTimeout(() => {
                localStorage.removeItem('wb-onboarding-store')
              }, 0)
              setTimeout(() => {
                localStorage.removeItem('wb-onboarding-store')
              }, 100)
            }
          },

          // Session Helper Functions for Page Components
          initializeSession: async (locale: 'en' | 'it' = 'en') => {
            set({ isLoading: true, error: null })
            
            try {
              const { OnboardingClientService } = await import('@/services/onboarding-client')
              const session = await OnboardingClientService.createSession(locale)
              
              set({
                sessionId: session.id,
                currentStep: session.currentStep && session.currentStep >= 1 ? session.currentStep : 1,
                formData: { ...initialFormData, ...session.formData },
                sessionExpiresAt: session.expiresAt,
                isSessionExpired: false,
                lastSaved: new Date(session.createdAt),
                isLoading: false,
                isDirty: false,
                completedSteps: []
              })

              // Track session start time for completion tracking
              if (typeof window !== 'undefined') {
                localStorage.setItem(`wb-onboarding-start-${session.id}`, Date.now().toString())
              }
              
              return session
            } catch (error) {
              console.error('Failed to initialize session:', error)
              set({ 
                error: error instanceof Error ? error.message : 'Failed to initialize session',
                isLoading: false 
              })
              throw error
            }
          },

          loadExistingSession: () => {
            const state = get()
            if (state.sessionId && !state.isSessionExpired) {
              return {
                id: state.sessionId,
                currentStep: state.currentStep,
                formData: state.formData,
                completedSteps: state.completedSteps,
                expiresAt: state.sessionExpiresAt,
                lastSaved: state.lastSaved
              }
            }
            return null
          },

          hasExistingSession: () => {
            const state = get()
            return Boolean(state.sessionId && !state.isSessionExpired)
          },

          updateCurrentStep: (stepNumber: number) => {
            set((state) => ({
              currentStep: Math.max(state.currentStep, stepNumber)
            }))
          },

          // Email Verification Methods
          verifyEmail: async (email: string, code: string): Promise<boolean> => {
            const { sessionId } = get()
            if (!sessionId) {
              throw new Error('No active session')
            }

            try {
              const response = await fetch('/api/onboarding/verify-email', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sessionId, code })
              })

              const result = await response.json()

              if (result.success) {
                set((state) => ({
                  formData: { ...state.formData, emailVerified: true }
                }))
                return true
              } else {
                return false
              }
            } catch (error) {
              console.error('Email verification failed:', error)
              throw error
            }
          },

          resendVerificationCode: async (email: string): Promise<void> => {
            const { sessionId, formData } = get()
            if (!sessionId) {
              throw new Error('No active session')
            }

            try {
              const response = await fetch('/api/onboarding/send-verification', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  sessionId,
                  email,
                  name: `${formData.firstName} ${formData.lastName}`.trim() || 'User',
                  locale: 'en' // TODO: Get from context
                })
              })

              const result = await response.json()

              if (!result.success) {
                throw new Error(result.error || 'Failed to send verification code')
              }
            } catch (error) {
              console.error('Failed to resend verification code:', error)
              throw error
            }
          }
        }
      },
      {
        name: 'wb-onboarding-store',
        // Only persist essential data, not the entire state
        partialize: (state) => ({
          sessionId: state.sessionId,
          currentStep: state.currentStep,
          completedSteps: state.completedSteps,
          sessionExpiresAt: state.sessionExpiresAt,
          formData: state.formData, // Persist form data to prevent loss on refresh
          isSessionExpired: state.isSessionExpired
        }),
        // Version for breaking changes
        version: 2,
      }
    ),
    {
      name: 'onboarding-store',
      // Disable in production for performance
      enabled: process.env.NODE_ENV === 'development'
    }
  )
)

// Helper function to extract step-specific data
function extractStepData(formData: Partial<OnboardingFormData>, step: number): any {
  switch (step) {
    case 1:
      return { firstName: formData.firstName, lastName: formData.lastName, email: formData.email }
    case 2:
      return { emailVerified: formData.emailVerified }
    case 3:
      return {
        businessName: formData.businessName,
        businessEmail: formData.businessEmail,
        businessPhone: formData.businessPhone,
        physicalAddress: formData.physicalAddress,
        industry: formData.industry,
        vatNumber: formData.vatNumber
      }
    case 4:
      return {
        businessDescription: formData.businessDescription,
        competitorUrls: formData.competitorUrls,
        competitorAnalysis: formData.competitorAnalysis
      }
    case 5:
      return { customerProfile: formData.customerProfile }
    case 6:
      return {
        customerProblems: formData.customerProblems,
        customerDelight: formData.customerDelight
      }
    case 7:
      return { websiteReferences: formData.websiteReferences }
    case 8:
      return { designStyle: formData.designStyle }
    case 9:
      return { imageStyle: formData.imageStyle }
    case 10:
      return { colorPalette: formData.colorPalette }
    case 11:
      return {
        websiteSections: formData.websiteSections,
        primaryGoal: formData.primaryGoal,
        offeringType: formData.offeringType,
        offerings: formData.offerings
      }
    case 12:
      return {
        logoUpload: formData.logoUpload,
        businessPhotos: formData.businessPhotos
      }
    case 13:
      return {
        completedAt: formData.completedAt,
        totalTimeSeconds: formData.totalTimeSeconds
      }
    default:
      return formData
  }
}

// Custom hooks for specific functionality
export const useOnboardingForm = () => {
  const formData = useOnboardingStore(state => state.formData)
  const updateFormData = useOnboardingStore(state => state.updateFormData)
  const isDirty = useOnboardingStore(state => state.isDirty)
  const saveProgress = useOnboardingStore(state => state.saveProgress)
  
  return { formData, updateFormData, isDirty, saveProgress }
}

export const useOnboardingNavigation = () => {
  const currentStep = useOnboardingStore(state => state.currentStep)
  const completedSteps = useOnboardingStore(state => state.completedSteps)
  const setCurrentStep = useOnboardingStore(state => state.setCurrentStep)
  const nextStep = useOnboardingStore(state => state.nextStep)
  const previousStep = useOnboardingStore(state => state.previousStep)
  const markStepComplete = useOnboardingStore(state => state.markStepComplete)
  
  return {
    currentStep,
    completedSteps,
    setCurrentStep,
    nextStep,
    previousStep,
    markStepComplete,
    canGoBack: currentStep > 1,
    canGoForward: currentStep < TOTAL_STEPS,
    isStepCompleted: (step: number) => completedSteps.includes(step)
  }
}

export const useOnboardingValidation = () => {
  const validateStep = useOnboardingStore(state => state.validateStep)
  const stepErrors = useOnboardingStore(state => state.stepErrors)
  const setStepErrors = useOnboardingStore(state => state.setStepErrors)
  const clearErrors = useOnboardingStore(state => state.clearErrors)
  
  return {
    validateStep,
    stepErrors,
    setStepErrors,
    clearErrors,
    getStepErrors: (step: number) => stepErrors[step] || [],
    hasStepErrors: (step: number) => (stepErrors[step] || []).length > 0
  }
}