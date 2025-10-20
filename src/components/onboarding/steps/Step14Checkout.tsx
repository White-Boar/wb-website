'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Controller } from 'react-hook-form'
import { motion } from 'framer-motion'
import {
  CreditCard,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShoppingCart,
  Tag
} from 'lucide-react'
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { StepComponentProps } from './index'
import {
  EUROPEAN_LANGUAGES,
  getLanguageName,
  calculateAddOnsTotal
} from '@/data/european-languages'
import { CheckoutSession } from '@/types/onboarding'

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

interface CheckoutFormProps extends StepComponentProps {
  sessionId: string
  submissionId: string
}

function CheckoutForm({
  form,
  errors,
  isLoading,
  sessionId,
  submissionId
}: CheckoutFormProps) {
  const t = useTranslations('onboarding.steps.14')
  const locale = useLocale() as 'en' | 'it'
  const stripe = useStripe()
  const elements = useElements()
  const { control, watch } = form

  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [checkoutSession, setCheckoutSession] = useState<CheckoutSession | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [isCreatingSession, setIsCreatingSession] = useState(true)

  // Watch form values
  const discountCode = watch('discountCode') || ''
  const acceptTerms = watch('acceptTerms') || false
  const selectedLanguages = watch('additionalLanguages') || []

  // Calculate pricing
  const basePackagePrice = 35 // €35/month
  const languageAddOnsTotal = calculateAddOnsTotal(selectedLanguages)
  const totalDueToday = basePackagePrice + languageAddOnsTotal

  // Create Stripe checkout session on mount
  useEffect(() => {
    const createCheckoutSession = async () => {
      try {
        setIsCreatingSession(true)
        setPaymentError(null)

        const response = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            submission_id: submissionId,
            additionalLanguages: selectedLanguages,
            discountCode: discountCode || undefined,
            successUrl: `${window.location.origin}/${locale}/onboarding/thank-you`,
            cancelUrl: `${window.location.origin}/${locale}/onboarding/step/14`,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error?.message || t('sessionCreationFailed'))
        }

        if (!data.success || !data.data.clientSecret) {
          throw new Error(t('noClientSecret'))
        }

        setClientSecret(data.data.clientSecret)
        setCheckoutSession(data.data)
      } catch (error) {
        console.error('Failed to create checkout session:', error)
        setPaymentError(
          error instanceof Error ? error.message : t('unexpectedError')
        )
      } finally {
        setIsCreatingSession(false)
      }
    }

    createCheckoutSession()
  }, [submissionId, selectedLanguages, discountCode, locale, t])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      setPaymentError(t('stripeNotLoaded'))
      return
    }

    if (!acceptTerms) {
      setPaymentError('You must accept the terms and conditions to proceed')
      return
    }

    try {
      setIsProcessing(true)
      setPaymentError(null)

      // Confirm payment
      const { error: submitError } = await elements.submit()
      if (submitError) {
        throw new Error(submitError.message)
      }

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/${locale}/onboarding/thank-you`,
        },
      })

      if (error) {
        // Payment failed - show error
        throw new Error(error.message)
      }

      // Payment succeeded - redirect happens automatically
    } catch (error) {
      console.error('Payment error:', error)
      setPaymentError(
        error instanceof Error ? error.message : t('unexpectedError')
      )
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Introduction */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
          <CreditCard className="w-8 h-8 text-primary" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            {t('heading')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
            {t('subtitle')}
          </p>
        </div>
      </motion.div>

      {/* Order Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              {t('orderSummary')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Base Package */}
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-medium">{t('basePackage')}</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {t('billedMonthly')}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {t('annualCommitment')}
                  </Badge>
                </div>
              </div>
              <p className="font-semibold">€{basePackagePrice}</p>
            </div>

            {/* Language Add-ons */}
            {selectedLanguages.length > 0 && (
              <>
                <div className="border-t pt-4">
                  <p className="font-medium mb-2">{t('languageAddons')}</p>
                  <div className="space-y-2">
                    {selectedLanguages.map((code) => (
                      <div
                        key={code}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="text-muted-foreground">
                          {getLanguageName(code, locale)}
                        </span>
                        <span>€75</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('oneTimeFee')}
                  </p>
                </div>
              </>
            )}

            {/* Discount Applied */}
            {checkoutSession?.discountApplied && (
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-sm text-green-600">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    <span>Discount: {checkoutSession.discountApplied.code}</span>
                  </div>
                  <span>-€{(checkoutSession.discountApplied.amount / 100).toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Total */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-lg">{t('dueToday')}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    €{basePackagePrice} {t('subscription')} + €{languageAddOnsTotal} {t('setupFees')}
                  </p>
                </div>
                <p className="text-2xl font-bold text-primary">
                  €{checkoutSession?.totalAmount
                    ? (checkoutSession.totalAmount / 100).toFixed(2)
                    : totalDueToday}
                </p>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {t('thenMonthly', { amount: basePackagePrice })}
              </p>
            </div>

            {/* Commitment Notice */}
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="text-xs">
                {t('commitmentNotice')}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </motion.div>

      {/* Discount Code - Removed since it needs to be applied during session creation */}
      {/* Payment form will recreate session if discount code changes */}

      {/* Payment Method */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              {t('paymentMethod')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isCreatingSession ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  {t('preparingCheckout')}
                </p>
              </div>
            ) : paymentError && !clientSecret ? (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  <p className="font-semibold mb-1">{t('checkoutError')}</p>
                  <p className="text-sm">{paymentError}</p>
                </AlertDescription>
              </Alert>
            ) : clientSecret ? (
              <>
                {/* Stripe Payment Element */}
                <div className="min-h-[200px]">
                  <PaymentElement />
                </div>

                {/* Security Notice */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="w-4 h-4" />
                  <span>{t('securePayment')}</span>
                </div>
              </>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{t('noClientSecret')}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Terms & Conditions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Controller
          name="acceptTerms"
          control={control}
          render={({ field }) => (
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/50">
              <Checkbox
                id="acceptTerms"
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isProcessing || isLoading}
              />
              <div className="flex-1">
                <Label
                  htmlFor="acceptTerms"
                  className="text-sm leading-relaxed cursor-pointer"
                >
                  {t.rich('termsText', {
                    termsLink: (chunks) => (
                      <a
                        href={`/${locale}/terms`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {chunks}
                      </a>
                    ),
                    privacyLink: (chunks) => (
                      <a
                        href={`/${locale}/privacy`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {chunks}
                      </a>
                    ),
                  })}
                </Label>
                {errors.acceptTerms && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.acceptTerms.message as string}
                  </p>
                )}
              </div>
            </div>
          )}
        />
      </motion.div>

      {/* Payment Error */}
      {paymentError && clientSecret && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              <p className="font-semibold mb-1">{t('paymentError')}</p>
              <p className="text-sm">{paymentError}</p>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex justify-end"
      >
        <Button
          type="submit"
          size="lg"
          disabled={
            isProcessing ||
            isLoading ||
            isCreatingSession ||
            !clientSecret ||
            !stripe ||
            !elements ||
            !acceptTerms
          }
          className="w-full sm:w-auto min-w-[200px]"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('processing')}
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {t('payNow', { amount: totalDueToday })}
            </>
          )}
        </Button>
      </motion.div>
    </form>
  )
}

// Wrapper component with Stripe Elements provider
export function Step14Checkout(props: StepComponentProps) {
  const t = useTranslations('onboarding.steps.14')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [isLoadingIds, setIsLoadingIds] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get sessionId from onboarding store
  useEffect(() => {
    const loadIds = async () => {
      try {
        // Import store dynamically to avoid SSR issues
        const { useOnboardingStore } = await import('@/stores/onboarding')
        const store = useOnboardingStore.getState()

        if (!store.sessionId) {
          setError('No active session found')
          setIsLoadingIds(false)
          return
        }

        setSessionId(store.sessionId)

        // Fetch submission ID from the session
        const response = await fetch(`/api/onboarding/get-submission?sessionId=${store.sessionId}`)

        if (!response.ok) {
          throw new Error('Failed to fetch submission')
        }

        const data = await response.json()

        if (data.submissionId) {
          setSubmissionId(data.submissionId)
        } else {
          setError('No submission found for this session')
        }
      } catch (err) {
        console.error('Error loading session/submission IDs:', err)
        setError(err instanceof Error ? err.message : 'Failed to load checkout session')
      } finally {
        setIsLoadingIds(false)
      }
    }

    loadIds()
  }, [])

  // Show loading state while fetching IDs
  if (isLoadingIds) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">{t('loadingCheckout')}</p>
        </div>
      </div>
    )
  }

  // Show error state if IDs couldn't be loaded
  if (error || !sessionId || !submissionId) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error || t('checkoutError')}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        mode: 'subscription',
        currency: 'eur',
        amount: 3500, // €35 base package in cents
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: 'hsl(var(--primary))',
            colorBackground: 'hsl(var(--background))',
            colorText: 'hsl(var(--foreground))',
            colorDanger: 'hsl(var(--destructive))',
            fontFamily: 'var(--font-sans)',
            borderRadius: '0.5rem',
          },
        },
      }}
    >
      <CheckoutForm
        {...props}
        sessionId={sessionId}
        submissionId={submissionId}
      />
    </Elements>
  )
}
