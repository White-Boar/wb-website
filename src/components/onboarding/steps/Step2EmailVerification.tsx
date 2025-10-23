'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'

import { EmailVerification } from '@/components/onboarding/EmailVerification'
import { useOnboardingStore } from '@/stores/onboarding'
import { StepComponentProps } from './index'

export function Step2EmailVerification({ form, data, isLoading, error }: StepComponentProps) {
  const t = useTranslations('onboarding.steps.2')
  const router = useRouter()
  const params = useParams()
  const [verificationError, setVerificationError] = useState<string>('')
  const [isVerifying, setIsVerifying] = useState(false)
  const hasAutoSentRef = useRef(false)

  const { verifyEmail, resendVerificationCode, formData, nextStep, validateStep } = useOnboardingStore()
  const locale = params.locale as string

  // Get email from Step 1 (with fallback for testing)
  const email = formData[1]?.email || formData.email || 'john.doe@test.com'

  // Auto-send verification email when component mounts
  useEffect(() => {
    // Only send once per mount
    if (!hasAutoSentRef.current && email) {
      hasAutoSentRef.current = true

      // Send verification email automatically
      resendVerificationCode(email, locale as 'en' | 'it')
        .catch((err) => {
          console.error('Failed to auto-send verification email:', err)
          // Don't show error to user - they can manually resend
        })
    }
  }, [email, locale, resendVerificationCode])

  const handleVerificationComplete = async (code: string) => {
    setIsVerifying(true)
    setVerificationError('')

    try {
      const isValid = await verifyEmail(email, code)
      if (isValid) {
        // Update form data to mark email as verified
        form.setValue('emailVerified', true)
        form.setValue('verificationCode', code)
        // Trigger validation to enable Next button
        await form.trigger('emailVerified')

        // Auto-progress to next step after successful verification
        setTimeout(async () => {
          try {
            // Validate step and move to next
            const isStepValid = await validateStep(2)
            if (isStepValid) {
              await nextStep()
              router.push(`/${locale}/onboarding/step/3`)
            }
          } catch (error) {
            console.error('Error auto-progressing to next step:', error)
          }
        }, 1000) // Small delay to show success state
      } else {
        setVerificationError(t('invalidCode'))
      }
    } catch (error) {
      console.error('Email verification failed:', error)
      setVerificationError(t('verificationFailed'))
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendCode = async () => {
    try {
      await resendVerificationCode(email, locale as 'en' | 'it')
    } catch (error) {
      console.error('Failed to resend verification code:', error)
      throw error // Let EmailVerification component handle the error
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto"
    >
      <EmailVerification
        email={email}
        onVerificationComplete={handleVerificationComplete}
        onResendCode={handleResendCode}
        isVerifying={isVerifying || isLoading}
        error={verificationError || error}
      />
    </motion.div>
  )
}