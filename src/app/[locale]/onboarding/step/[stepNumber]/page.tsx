'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { useOnboardingStore } from '@/stores/onboarding'
import { StepTemplate } from '@/components/onboarding/StepTemplate'
import { getStepComponent } from '@/components/onboarding/steps'
import { getStepSchema, type StepFormData } from '@/schemas/onboarding'

export default function OnboardingStep() {
  const router = useRouter()
  const params = useParams()
  const t = useTranslations('onboarding.steps')

  const stepNumber = parseInt(params.stepNumber as string)
  const locale = params.locale as string
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const {
    currentStep,
    formData,
    updateFormData,
    nextStep,
    previousStep,
    validateStep,
    isSessionExpired,
    sessionId,
    initializeSession,
    hasExistingSession
  } = useOnboardingStore()

  // Initialize session if none exists or load existing session from URL
  useEffect(() => {
    const initSession = async () => {
      // Check for session ID in URL params first
      const urlSessionId = new URLSearchParams(window.location.search).get('session')

      if (urlSessionId && urlSessionId !== sessionId) {
        try {
          setIsLoading(true)
          // Load existing session from URL
          const { initSession: loadExistingSession } = useOnboardingStore.getState()
          await loadExistingSession(urlSessionId)
        } catch (error) {
          console.error('Failed to load session from URL:', error)
          // If loading session fails, create a new one
          await initializeSession(locale)
        } finally {
          setIsLoading(false)
        }
      } else if (!hasExistingSession() && !sessionId) {
        try {
          setIsLoading(true)
          await initializeSession(locale)
        } catch (error) {
          console.error('Failed to initialize session:', error)
          setError('Failed to initialize session. Please try again.')
        } finally {
          setIsLoading(false)
        }
      }

      // If we have a session but current step is behind the step number,
      // update current step to allow access to this step
      else if (sessionId && currentStep < stepNumber && stepNumber <= 13) {
        // This handles cases where user bookmarked a step or has progressed beyond the stored current step
        const { updateCurrentStep } = useOnboardingStore.getState()
        updateCurrentStep(stepNumber)
      }
    }

    initSession()
  }, [hasExistingSession, sessionId, initializeSession, locale])

  // Validate step number
  if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > 13) {
    router.push('/onboarding')
    return null
  }

  // Redirect if trying to access a step too far ahead (only if session is loaded)
  useEffect(() => {
    // Only redirect if we have a valid session and user is trying to skip ahead
    if (sessionId && currentStep > 0 && stepNumber > currentStep + 1) {
      console.log(`Redirecting from step ${stepNumber} to current step ${currentStep}`)
      router.push(`/onboarding/step/${currentStep}`)
    }
  }, [stepNumber, currentStep, router, sessionId])

  // Get step schema and form setup
  const schema = getStepSchema(stepNumber)

  // Validate schema exists
  if (!schema) {
    router.push('/onboarding')
    return null
  }

  // Extract default values for current step from store
  const getStepDefaultValues = (step: number) => {
    switch (step) {
      case 1:
        return {
          firstName: formData?.firstName ?? '',
          lastName: formData?.lastName ?? '',
          email: formData?.email ?? ''
        }
      case 2:
        return {
          emailVerified: formData?.emailVerified ?? false
        }
      case 3:
        return {
          businessName: formData?.businessName ?? '',
          businessEmail: formData?.businessEmail ?? '',
          businessPhone: formData?.businessPhone ?? '',
          physicalAddress: {
            street: formData?.physicalAddress?.street ?? '',
            city: formData?.physicalAddress?.city ?? '',
            province: formData?.physicalAddress?.province ?? '',
            postalCode: formData?.physicalAddress?.postalCode ?? '',
            country: formData?.physicalAddress?.country ?? 'Italy',
            placeId: formData?.physicalAddress?.placeId ?? ''
          },
          industry: formData?.industry ?? '',
          vatNumber: formData?.vatNumber ?? ''
        }
      case 4:
        return {
          businessDescription: formData?.businessDescription || '',
          competitorUrls: formData?.competitorUrls || [],
          competitorAnalysis: formData?.competitorAnalysis || ''
        }
      case 5:
        return {
          customerProfile: formData?.customerProfile ? {
            budget: formData.customerProfile.budget !== undefined ? formData.customerProfile.budget : 50,
            style: formData.customerProfile.style !== undefined ? formData.customerProfile.style : 50,
            motivation: formData.customerProfile.motivation !== undefined ? formData.customerProfile.motivation : 50,
            decisionMaking: formData.customerProfile.decisionMaking !== undefined ? formData.customerProfile.decisionMaking : 50,
            loyalty: formData.customerProfile.loyalty !== undefined ? formData.customerProfile.loyalty : 50
          } : {
            budget: 50,
            style: 50,
            motivation: 50,
            decisionMaking: 50,
            loyalty: 50
          }
        }
      case 6:
        return {
          customerProblems: formData?.customerProblems || '',
          customerDelight: formData?.customerDelight || ''
        }
      case 7:
        return {
          websiteReferences: formData?.websiteReferences || []
        }
      case 8:
        return {
          designStyle: formData?.designStyle || ''
        }
      case 9:
        return {
          imageStyle: formData?.imageStyle || ''
        }
      case 10:
        return {
          colorPalette: formData?.colorPalette || ''
        }
      case 11:
        return {
          websiteSections: formData?.websiteSections || [],
          primaryGoal: formData?.primaryGoal || '',
          offerings: formData?.offerings || []
        }
      default:
        return {}
    }
  }

  const form = useForm<StepFormData>({
    resolver: zodResolver(schema),
    defaultValues: getStepDefaultValues(stepNumber),
    mode: 'onChange'
  })

  const { handleSubmit, formState: { errors, isValid, isDirty } } = form

  // Reset form values when formData changes (e.g., loaded from localStorage)
  useEffect(() => {
    const currentValues = getStepDefaultValues(stepNumber)
    form.reset(currentValues)
  }, [formData, stepNumber, form])

  // Auto-save functionality
  useEffect(() => {
    const subscription = form.watch((data) => {
      if (isDirty && data) {
        updateFormData(data as StepFormData)
      }
    })
    return () => subscription.unsubscribe()
  }, [form, updateFormData, isDirty])

  // Handle next step
  const handleNext = async (data: StepFormData) => {
    setIsLoading(true)
    setError('')

    try {
      // Update form data
      updateFormData(data)

      // Validate current step
      const isStepValid = await validateStep(stepNumber)
      if (!isStepValid) {
        setError(t('validationError'))
        return
      }

      // Move to next step or complete
      if (stepNumber < 13) {
        await nextStep()
        router.push(`/${locale}/onboarding/step/${stepNumber + 1}`)
      } else {
        // Complete onboarding
        router.push(`/${locale}/onboarding/complete`)
      }
    } catch (error) {
      console.error('Error proceeding to next step:', error)
      setError(t('nextStepError'))
    } finally {
      setIsLoading(false)
    }
  }

  // Handle previous step
  const handlePrevious = () => {
    if (stepNumber > 1) {
      router.push(`/${locale}/onboarding/step/${stepNumber - 1}`)
    } else {
      router.push(`/${locale}/onboarding`)
    }
  }

  // Session expired redirect
  if (isSessionExpired) {
    router.push(`/${locale}/onboarding`)
    return null
  }

  // Get step component
  const StepComponent = getStepComponent(stepNumber)
  
  if (!StepComponent) {
    router.push('/onboarding')
    return null
  }

  return (
    <StepTemplate
      stepNumber={stepNumber}
      title={t(`${stepNumber}.title`)}
      description={t(`${stepNumber}.description`)}
      onNext={handleSubmit(handleNext)}
      onPrevious={handlePrevious}
      canGoNext={isValid && !isLoading}
      canGoPrevious={stepNumber > 1}
      isLoading={isLoading}
      nextLabel={stepNumber === 13 ? t('complete') : undefined}
      previousLabel={stepNumber === 1 ? t('back') : undefined}
    >
      <StepComponent
        form={form}
        data={getStepDefaultValues(stepNumber)}
        errors={errors}
        isLoading={isLoading}
        error={error}
      />
    </StepTemplate>
  )
}