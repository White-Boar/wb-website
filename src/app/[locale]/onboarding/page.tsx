'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Clock, Shield, CheckCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useOnboardingStore } from '@/stores/onboarding'

export default function OnboardingWelcome() {
  const t = useTranslations('onboarding.welcome')
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as 'en' | 'it'
  const { initializeSession, loadExistingSession } = useOnboardingStore()
  const [mounted, setMounted] = useState(false)

  // Handle hydration and session check
  useEffect(() => {
    setMounted(true)

    // Check for existing session after mount
    const existingSession = loadExistingSession()
    // Only redirect if there's a valid session with an ID (not just default state)
    if (existingSession && existingSession.id && existingSession.currentStep && existingSession.currentStep > 1) {
      // Redirect to appropriate step
      router.push(`/onboarding/step/${existingSession.currentStep}`)
    }
  }, [loadExistingSession, router])

  const handleStart = async () => {
    try {
      const session = await initializeSession(locale)
      const step = session.currentStep && session.currentStep >= 1 ? session.currentStep : 1
      router.push(`/onboarding/step/${step}`)
    } catch (error) {
      console.error('Failed to initialize onboarding session:', error)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center space-y-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-4 -right-4 text-primary/20"
            >
              <Sparkles className="w-8 h-8" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t('title')}
            </h1>
          </div>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid md:grid-cols-3 gap-6 my-12"
        >
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">{t('features.fast.title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('features.fast.description')}
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">{t('features.secure.title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('features.secure.description')}
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">{t('features.smart.title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('features.smart.description')}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Process Steps */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('process.title')}</h2>
          
          <div className="grid md:grid-cols-4 gap-4 text-left">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                  {step}
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                    {t(`process.steps.${step}.title`)}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t(`process.steps.${step}.description`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* What You'll Need */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-muted/50 rounded-lg p-6 text-left"
        >
          <h3 className="font-semibold mb-4 text-center text-foreground">{t('requirements.title')}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-foreground">{t('requirements.business.title')}</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {['name', 'email', 'address', 'phone'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    {t(`requirements.business.items.${item}`)}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-foreground">{t('requirements.optional.title')}</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {['logo', 'photos', 'competitors', 'content'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    {t(`requirements.optional.items.${item}`)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="space-y-6 pt-4"
        >
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={handleStart}
              className="gap-2 px-8"
              disabled={!mounted}
            >
              {t('actions.start')}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            {t('disclaimer')}
          </p>
        </motion.div>
      </div>
    </div>
  )
}