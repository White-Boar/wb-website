'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { CheckCircle2, Mail, Phone, Globe, Sparkles, ArrowRight, Loader2 } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { StepComponentProps } from './index'
import { useOnboardingStore } from '@/stores/onboarding'
import { submitOnboarding } from '@/services/onboarding-client'
import { toast } from 'sonner'

export function Step13Completion({ form, errors, isLoading }: StepComponentProps) {
  const t = useTranslations('onboarding.steps.13')
  const { watch } = form
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { sessionId, clearSession } = useOnboardingStore()

  // Get summary data from form
  const formData = watch() as any
  const {
    businessName,
    businessType,
    contactEmail,
    contactPhone,
    websiteDescription,
    targetAudience,
    primaryGoal,
    websiteSections = [],
    designStyle,
    colorPreference,
    offerings = [],
    businessLogo,
    businessPhotos = []
  } = formData

  // Calculate completion percentage
  const completedFields = [
    businessName,
    businessType,
    contactEmail,
    websiteDescription,
    targetAudience,
    primaryGoal,
    designStyle,
    colorPreference
  ].filter(Boolean).length

  const totalRequiredFields = 8
  const completionPercentage = Math.round((completedFields / totalRequiredFields) * 100)

  const handleSubmit = async () => {
    if (!sessionId) {
      toast.error('Session not found. Please try again.')
      return
    }

    setSubmitting(true)
    try {
      await submitOnboarding(sessionId, formData)
      setSubmitted(true)
      toast.success(t('submission.success'))
      
      // Clear the session after successful submission
      setTimeout(() => {
        clearSession()
      }, 3000)
    } catch (error) {
      console.error('Submission failed:', error)
      toast.error(t('submission.error'))
    } finally {
      setSubmitting(false)
    }
  }


  return (
    <div className="space-y-8">
      {/* Completion Celebration */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6"
      >
        <div className="relative">
          <div className="w-20 h-20 mx-auto bg-primary rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute -top-1 -right-1 w-8 h-8 bg-accent rounded-full flex items-center justify-center"
          >
            <Sparkles className="w-4 h-4 text-accent-foreground" />
          </motion.div>
        </div>
        
        <div className="space-y-3">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-primary"
          >
            {t('celebration.title')}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground max-w-2xl mx-auto"
          >
            {t('celebration.description')}
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-2"
          >
            <Badge variant="secondary" className="bg-accent/10 text-accent-foreground">
              {t('celebration.completion')} {completionPercentage}%
            </Badge>
            <Badge variant="outline">
              {t('celebration.timeEstimate')}
            </Badge>
          </motion.div>
        </div>
      </motion.div>

      {/* Project Summary */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              {t('summary.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Business Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  {t('summary.business.title')}
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{t('summary.business.name')}</span>
                    <span className="text-muted-foreground">{businessName || t('summary.notProvided')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{t('summary.business.type')}</span>
                    <span className="text-muted-foreground">{businessType || t('summary.notProvided')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{t('summary.business.email')}</span>
                    <span className="text-muted-foreground">{contactEmail || t('summary.notProvided')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{t('summary.business.phone')}</span>
                    <span className="text-muted-foreground">{contactPhone || t('summary.notProvided')}</span>
                  </div>
                </div>
              </div>

              {/* Project Details */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  {t('summary.project.title')}
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{t('summary.project.goal')}</span>
                    <span className="text-muted-foreground">{primaryGoal || t('summary.notProvided')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{t('summary.project.style')}</span>
                    <span className="text-muted-foreground">{designStyle || t('summary.notProvided')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{t('summary.project.colors')}</span>
                    <span className="text-muted-foreground">{colorPreference || t('summary.notProvided')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{t('summary.project.sections')}</span>
                    <span className="text-muted-foreground">{websiteSections.length} {t('summary.project.sectionsCount')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Assets Summary */}
            <div className="space-y-3">
              <Separator />
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                {t('summary.assets.title')}
              </h4>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${businessLogo ? 'bg-accent' : 'bg-muted'}`} />
                  <span>{t('summary.assets.logo')}: {businessLogo ? t('summary.uploaded') : t('summary.notUploaded')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${businessPhotos.length > 0 ? 'bg-accent' : 'bg-muted'}`} />
                  <span>{t('summary.assets.photos')}: {businessPhotos.length} {t('summary.assets.photosUploaded')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${offerings.length > 0 ? 'bg-accent' : 'bg-muted'}`} />
                  <span>{t('summary.assets.offerings')}: {offerings.length} {t('summary.assets.offeringsAdded')}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Contact Information */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              <h4 className="font-semibold text-primary">{t('contact.title')}</h4>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h5 className="font-medium text-primary">{t('contact.support.title')}</h5>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-3 h-3" />
                    <span>info@whiteboar.com</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-3 h-3" />
                    <span>+39 02 1234 5678</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h5 className="font-medium text-primary">{t('contact.availability.title')}</h5>
                <p className="text-muted-foreground text-xs">{t('contact.availability.description')}</p>
              </div>
            </div>

            <div className="bg-white/50 rounded-lg p-3 text-center">
              <p className="text-sm text-primary font-medium">
                {t('contact.response.title')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('contact.response.description')}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Thank You Message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="text-center space-y-4"
      >
        <div className="bg-accent/10 rounded-lg p-6 space-y-3">
          <h4 className="font-semibold text-accent-foreground">{t('thankYou.title')}</h4>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            {t('thankYou.message')}
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4" />
            <span>{t('thankYou.team')}</span>
            <ArrowRight className="w-4 h-4" />
            <span className="font-medium">WhiteBoar</span>
          </div>
        </div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          className="pt-4"
        >
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary/90 min-h-[44px] px-8"
            disabled={isLoading || submitting || submitted}
            aria-label={t('cta.button')}
            onClick={handleSubmit}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('submission.submitting')}
              </>
            ) : submitted ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {t('submission.completed')}
              </>
            ) : (
              <>
                {t('cta.button')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            {t('cta.description')}
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}