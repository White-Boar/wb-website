'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'

import { EmailVerification } from '@/components/onboarding/EmailVerification'
import { useOnboardingStore } from '@/stores/onboarding'
import { StepComponentProps } from './index'

export function Step2EmailVerification({ form, data, isLoading, error }: StepComponentProps) {
  const t = useTranslations('onboarding.steps.2')
  const [verificationError, setVerificationError] = useState<string>('')
  const [isVerifying, setIsVerifying] = useState(false)
  
  const { verifyEmail, resendVerificationCode, formData } = useOnboardingStore()
  
  // Get email from Step 1 (with fallback for testing)
  const email = formData[1]?.email || formData.email || 'john.doe@test.com'

  const handleVerificationComplete = async (code: string) => {
    setIsVerifying(true)
    setVerificationError('')

    try {
      const isValid = await verifyEmail(email, code)
      if (isValid) {
        // Update form data to mark email as verified
        form.setValue('emailVerified', true)
        form.setValue('verificationCode', code)
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
      await resendVerificationCode(email)
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