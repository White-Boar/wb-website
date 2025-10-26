'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Controller } from 'react-hook-form'
import { motion } from 'framer-motion'
import Link from 'next/link'
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
const STRIPE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
console.log('[DEBUG] Stripe key prefix:', STRIPE_KEY.substring(0, 15))
const stripePromise = loadStripe(STRIPE_KEY)

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

  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [isVerifyingDiscount, setIsVerifyingDiscount] = useState(false)
  const [discountValidation, setDiscountValidation] = useState<{
    status: 'valid' | 'invalid'
    code?: string
    amount?: number
    error?: string
  } | null>(null)

  // Watch form values for reactive updates
  const acceptTerms = watch('acceptTerms') || false
  const selectedLanguages = watch('additionalLanguages') || []
  const discountCode = watch('discountCode') || ''

  // Calculate pricing
  const basePackagePrice = 35 // €35/month
  const languageAddOnsTotal = calculateAddOnsTotal(selectedLanguages)
  const discountAmount = discountValidation?.status === 'valid' ? (discountValidation.amount || 0) / 100 : 0
  const totalDueToday = basePackagePrice + languageAddOnsTotal - discountAmount

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

  // Handle discount code verification
  const handleVerifyDiscount = async () => {
    const code = form.getValues('discountCode')?.trim()

    if (!code) {
      setDiscountValidation({
        status: 'invalid',
        error: t('discount.emptyCode')
      })
      return
    }

    try {
      setIsVerifyingDiscount(true)
      setDiscountValidation(null)

      // Fetch CSRF token first
      const csrfResponse = await fetch(`/api/csrf-token?sessionId=${sessionId}`)
      const csrfData = await csrfResponse.json()

      if (!csrfResponse.ok || !csrfData.success) {
        throw new Error('Failed to get CSRF token')
      }

      // Create AbortController with 10-minute timeout (600000ms)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 600000)

      const response = await fetch('/api/stripe/validate-discount', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfData.token
        },
        body: JSON.stringify({
          discountCode: code,
          sessionId: sessionId
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      const data = await response.json()

      if (!response.ok || !data.success) {
        setDiscountValidation({
          status: 'invalid',
          error: data.error?.message || t('discount.invalidCode')
        })
        return
      }

      // Valid discount code
      setDiscountValidation({
        status: 'valid',
        code: data.data.code,
        amount: data.data.amount
      })

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setDiscountValidation({
          status: 'invalid',
          error: t('discount.timeout')
        })
      } else {
        setDiscountValidation({
          status: 'invalid',
          error: t('discount.verificationError')
        })
      }
    } finally {
      setIsVerifyingDiscount(false)
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

            {/* Discount */}
            {discountValidation?.status === 'valid' && discountAmount > 0 && (
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    <p className="font-medium">{t('discount.applied')}</p>
                    <Badge variant="secondary" className="text-xs">
                      {discountValidation.code}
                    </Badge>
                  </div>
                  <p className="font-semibold">-€{discountAmount.toFixed(2)}</p>
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
                    {discountAmount > 0 && ` - €${discountAmount.toFixed(2)} ${t('discount.label')}`}
                  </p>
                </div>
                <p className="text-2xl font-bold text-primary">
                  €{totalDueToday}
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

      {/* Discount Code */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              {t('discount.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Controller
              name="discountCode"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <Label htmlFor="discountCode">{t('discount.label')}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="discountCode"
                      placeholder={t('discount.placeholder')}
                      value={field.value || ''}
                      onChange={(e) => {
                        field.onChange(e.target.value.toUpperCase())
                        // Reset validation when user changes the code
                        if (discountValidation) {
                          setDiscountValidation(null)
                        }
                      }}
                      disabled={isVerifyingDiscount || isProcessing}
                      className="flex-1 uppercase"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleVerifyDiscount}
                      disabled={
                        isVerifyingDiscount ||
                        isProcessing ||
                        !field.value?.trim()
                      }
                      className="min-w-[100px]"
                    >
                      {isVerifyingDiscount ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t('discount.verifying')}
                        </>
                      ) : (
                        t('discount.verify')
                      )}
                    </Button>
                  </div>
                  {errors.discountCode && (
                    <p className="text-sm text-destructive">
                      {errors.discountCode.message || 'Invalid discount code'}
                    </p>
                  )}
                </div>
              )}
            />

            {/* Validation Status */}
            {discountValidation && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {discountValidation.status === 'valid' ? (
                  <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      {t('discount.validMessage', {
                        code: discountValidation.code || '',
                        amount: (discountValidation.amount || 0) / 100
                      })}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>
                      {discountValidation.error}
                    </AlertDescription>
                  </Alert>
                )}
              </motion.div>
            )}

            {/* Helper Text */}
            {!discountValidation && (
              <p className="text-xs text-muted-foreground">
                {t('discount.helperText')}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

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
            {/* Stripe Payment Element */}
            <div className="min-h-[200px]" data-testid="stripe-payment-element">
              <PaymentElement
                options={{
                  layout: 'tabs',
                }}
              />
            </div>

            {/* Security Notice */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="w-4 h-4" />
              <span>{t('securePayment')}</span>
            </div>
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
                className="mt-1 shrink-0"
              />
              <div className="flex-1">
                <Label htmlFor="acceptTerms" className="text-sm cursor-pointer inline">
                  {t.rich('termsText', {
                    termsLink: (chunks) => (
                      <Link href="/terms" target="_blank" className="text-primary hover:underline">
                        {chunks}
                      </Link>
                    ),
                    privacyLink: (chunks) => (
                      <Link href="/privacy" target="_blank" className="text-primary hover:underline">
                        {chunks}
                      </Link>
                    ),
                  })}
                </Label>
                {errors.acceptTerms && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.acceptTerms.message || 'Please accept terms'}
                  </p>
                )}
              </div>
            </div>
          )}
        />
      </motion.div>

      {/* Payment Error */}
      {paymentError && (
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
    <CheckoutFormWrapper
      {...props}
      sessionId={sessionId}
      submissionId={submissionId}
    />
  )
}

// Wrapper component that fetches clientSecret before initializing Stripe Elements
function CheckoutFormWrapper(props: CheckoutFormProps) {
  const { form, submissionId } = props
  const t = useTranslations('onboarding.steps.14')
  const locale = useLocale() as 'en' | 'it'

  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isLoadingSecret, setIsLoadingSecret] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Prevent duplicate API calls (React Strict Mode runs effects twice in dev)
  const hasFetchedRef = useRef(false)

  // Fetch clientSecret on mount ONCE
  useEffect(() => {
    // Skip if already fetched or currently fetching
    if (hasFetchedRef.current) {
      return
    }

    // Mark as fetched IMMEDIATELY to prevent race condition in React Strict Mode
    // This prevents the second useEffect run from starting another fetch
    hasFetchedRef.current = true

    const fetchClientSecret = async () => {
      try {
        setIsLoadingSecret(true)
        setError(null)

        // Get form values inside the effect to avoid stale closures
        const selectedLanguages = form.getValues('additionalLanguages') || []
        const discountCode = form.getValues('discountCode') || ''

        // Fetch CSRF token first
        const csrfResponse = await fetch(`/api/csrf-token?sessionId=${submissionId}`)
        const csrfData = await csrfResponse.json()

        if (!csrfResponse.ok || !csrfData.success) {
          throw new Error('Failed to get CSRF token')
        }

        const response = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfData.token
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

        if (!response.ok || !data.success) {
          throw new Error(data.error?.message || 'Failed to create checkout session')
        }

        if (!data.data.clientSecret) {
          throw new Error('No client secret received')
        }

        setClientSecret(data.data.clientSecret)
      } catch (err) {
        console.error('Failed to fetch client secret:', err)
        setError(err instanceof Error ? err.message : 'Failed to initialize payment')
        // Reset flag on error to allow retry
        hasFetchedRef.current = false
      } finally {
        setIsLoadingSecret(false)
      }
    }

    fetchClientSecret()
    // Only run once on mount with submissionId and locale
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionId, locale])

  // Show loading state
  if (isLoadingSecret) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          {t('preparingCheckout')}
        </p>
      </div>
    )
  }

  // Show error state
  if (error || !clientSecret) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>
          <p className="font-semibold mb-1">{t('checkoutError')}</p>
          <p className="text-sm">{error || 'Failed to initialize payment'}</p>
        </AlertDescription>
      </Alert>
    )
  }

  // Render Stripe Elements with clientSecret
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
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
        loader: 'always', // Ensure loader is always shown for better test reliability
      }}
    >
      <CheckoutForm {...props} />
    </Elements>
  )
}
