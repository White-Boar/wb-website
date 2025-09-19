'use client'

import { useTranslations } from 'next-intl'
import { Controller } from 'react-hook-form'
import { motion } from 'framer-motion'
import { User, Sparkles } from 'lucide-react'

import { TextInput } from '@/components/onboarding/form-fields/TextInput'
import { EmailInput } from '@/components/onboarding/form-fields/EmailInput'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StepComponentProps } from './index'

export function Step1Welcome({ form, errors, isLoading }: StepComponentProps) {
  const t = useTranslations('onboarding.steps.1')
  const { control, setValue } = form

  const handleEmailValidation = (isValid: boolean, email: string) => {
    if (isValid) {
      // Auto-generate session data or perform additional validation if needed
      console.log('Valid email entered:', email)
    }
  }

  return (
    <div className="space-y-8">
      {/* Welcome Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-accent" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">{t('welcome')}</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            {t('subtitle')}
          </p>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-3 gap-4"
      >
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-accent">13</div>
            <div className="text-xs text-muted-foreground">{t('stats.steps')}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-accent">~12</div>
            <div className="text-xs text-muted-foreground">{t('stats.minutes')}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-accent">€40</div>
            <div className="text-xs text-muted-foreground">{t('stats.price')}</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Contact Information Form */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-6"
      >
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-accent" />
              <h3 className="text-lg font-semibold text-foreground">{t('contactInfo.title')}</h3>
              <Badge variant="secondary" className="ml-auto">
                {t('contactInfo.required')}
              </Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* First Name */}
              <Controller
                name="firstName"
                control={control}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    label={t('contactInfo.firstName.label')}
                    placeholder={t('contactInfo.firstName.placeholder')}
                    hint={t('contactInfo.firstName.hint')}
                    error={(errors as any).firstName?.message}
                    required
                    disabled={isLoading}
                    leftIcon={<User className="w-4 h-4" />}
                  />
                )}
              />

              {/* Last Name */}
              <Controller
                name="lastName"
                control={control}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    label={t('contactInfo.lastName.label')}
                    placeholder={t('contactInfo.lastName.placeholder')}
                    hint={t('contactInfo.lastName.hint')}
                    error={(errors as any).lastName?.message}
                    required
                    disabled={isLoading}
                    leftIcon={<User className="w-4 h-4" />}
                  />
                )}
              />
            </div>

            {/* Email Address */}
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <EmailInput
                  {...field}
                  label={t('contactInfo.email.label')}
                  placeholder={t('contactInfo.email.placeholder')}
                  hint={t('contactInfo.email.hint')}
                  error={(errors as any).email?.message}
                  required
                  disabled={isLoading}
                  onValidationChange={handleEmailValidation}
                />
              )}
            />
          </CardContent>
        </Card>

        {/* Privacy Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-xs text-muted-foreground"
        >
          <p>{t('privacy.notice')}</p>
        </motion.div>
      </motion.div>
    </div>
  )
}