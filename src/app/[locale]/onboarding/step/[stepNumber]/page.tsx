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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const {
    currentStep,
    formData,
    updateFormData,
    nextStep,
    previousStep,
    validateStep,
    isSessionExpired
  } = useOnboardingStore()

  // Validate step number
  if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > 13) {
    router.push('/onboarding')
    return null
  }

  // Redirect if not on current step (except for backward navigation)
  useEffect(() => {
    if (stepNumber > currentStep + 1) {
      router.push(`/onboarding/step/${currentStep}`)
    }
  }, [stepNumber, currentStep, router])

  // Get step schema and form setup
  const schema = getStepSchema(stepNumber)
  const form = useForm<StepFormData>({
    resolver: zodResolver(schema),
    defaultValues: formData[stepNumber] || {},
    mode: 'onBlur'
  })

  const { handleSubmit, formState: { errors, isValid, isDirty } } = form

  // Auto-save functionality
  useEffect(() => {
    const subscription = form.watch((data) => {
      if (isDirty) {
        updateFormData(stepNumber, data as StepFormData)
      }
    })
    return () => subscription.unsubscribe()
  }, [form, stepNumber, updateFormData, isDirty])

  // Handle next step
  const handleNext = async (data: StepFormData) => {
    setIsLoading(true)
    setError('')

    try {
      // Update form data
      updateFormData(stepNumber, data)
      
      // Validate current step
      const isStepValid = await validateStep(stepNumber)
      if (!isStepValid) {
        setError(t('validationError'))
        return
      }

      // Move to next step or complete
      if (stepNumber < 13) {
        await nextStep()
        router.push(`/onboarding/step/${stepNumber + 1}`)
      } else {
        // Complete onboarding
        router.push('/onboarding/complete')
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
      router.push(`/onboarding/step/${stepNumber - 1}`)
    } else {
      router.push('/onboarding')
    }
  }

  // Session expired redirect
  if (isSessionExpired) {
    router.push('/onboarding')
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
        data={formData[stepNumber]}
        errors={errors}
        isLoading={isLoading}
        error={error}
      />
    </StepTemplate>
  )
}