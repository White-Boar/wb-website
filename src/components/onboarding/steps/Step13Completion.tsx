'use client'

import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { CheckCircle2, Clock, Mail, Phone, Globe, Sparkles, ArrowRight } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { StepComponentProps } from './index'

export function Step13Completion({ form, errors, isLoading }: StepComponentProps) {
  const t = useTranslations('onboarding.steps.13')
  const { watch } = form

  // Get summary data from form
  const formData = watch()
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

  const getNextSteps = () => [
    { 
      step: 1, 
      title: t('nextSteps.review.title'),
      description: t('nextSteps.review.description'),
      timeframe: t('nextSteps.review.timeframe')
    },
    { 
      step: 2, 
      title: t('nextSteps.preview.title'),
      description: t('nextSteps.preview.description'),
      timeframe: t('nextSteps.preview.timeframe')
    },
    { 
      step: 3, 
      title: t('nextSteps.revisions.title'),
      description: t('nextSteps.revisions.description'),
      timeframe: t('nextSteps.revisions.timeframe')
    },
    { 
      step: 4, 
      title: t('nextSteps.launch.title'),
      description: t('nextSteps.launch.description'),
      timeframe: t('nextSteps.launch.timeframe')
    }
  ]

  return (
    <div className="space-y-8">
      {/* Completion Celebration */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6"
      >
        <div className="relative">
          <div className="w-20 h-20 mx-auto bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute -top-1 -right-1 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center"
          >
            <Sparkles className="w-4 h-4 text-yellow-800" />
          </motion.div>
        </div>
        
        <div className="space-y-3">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-green-700"
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
            <Badge variant="secondary" className="bg-green-100 text-green-700">
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
                  <div className={`w-2 h-2 rounded-full ${businessLogo ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span>{t('summary.assets.logo')}: {businessLogo ? t('summary.uploaded') : t('summary.notUploaded')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${businessPhotos.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span>{t('summary.assets.photos')}: {businessPhotos.length} {t('summary.assets.photosUploaded')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${offerings.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span>{t('summary.assets.offerings')}: {offerings.length} {t('summary.assets.offeringsAdded')}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Next Steps Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              {t('nextSteps.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {getNextSteps().map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + (index * 0.1) }}
                  className="flex gap-4"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                      {step.step}
                    </div>
                    {index < getNextSteps().length - 1 && (
                      <div className="w-0.5 h-12 bg-muted mt-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{step.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {step.timeframe}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </motion.div>
              ))}
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
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-blue-700">{t('contact.title')}</h4>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h5 className="font-medium text-blue-700">{t('contact.support.title')}</h5>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Mail className="w-3 h-3" />
                    <span>info@whiteboar.com</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-600">
                    <Phone className="w-3 h-3" />
                    <span>+39 02 1234 5678</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h5 className="font-medium text-blue-700">{t('contact.availability.title')}</h5>
                <p className="text-blue-600 text-xs">{t('contact.availability.description')}</p>
              </div>
            </div>

            <div className="bg-white/50 rounded-lg p-3 text-center">
              <p className="text-sm text-blue-700 font-medium">
                {t('contact.response.title')}
              </p>
              <p className="text-xs text-blue-600">
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
        <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg p-6 space-y-3">
          <h4 className="font-semibold text-green-800">{t('thankYou.title')}</h4>
          <p className="text-sm text-green-700 max-w-2xl mx-auto">
            {t('thankYou.message')}
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-green-600">
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
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            disabled={isLoading}
          >
            {t('cta.button')}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            {t('cta.description')}
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}