'use client'

import { useOnboardingStepTranslation } from '@/hooks/useTranslationWithFallback'
import { Controller } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Target, Lightbulb, Link, Users } from 'lucide-react'

import { TextareaInput } from '@/components/onboarding/form-fields/TextareaInput'
import { TextInput } from '@/components/onboarding/form-fields/TextInput'
import { DynamicList } from '@/components/onboarding/DynamicList'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StepComponentProps } from './index'

export function Step4BrandDefinition({ form, errors, isLoading }: StepComponentProps) {
  const { t } = useOnboardingStepTranslation(4)
  const { control, setValue, watch } = form

  const competitorUrls = watch('competitorUrls') || []

  const handleCompetitorUrlsChange = (items: any[]) => {
    const urls = items.map(item => item.value)
    setValue('competitorUrls', urls)
  }

  return (
    <div className="space-y-8">
      {/* Business Offering */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">{t('offering.title')}</h3>
              <Badge variant="secondary" className="ml-auto">
                {t('offering.required')}
              </Badge>
            </div>

            <Controller
              name="businessDescription"
              control={control}
              render={({ field }) => (
                <TextareaInput
                  {...field}
                  label={t('offering.description.label')}
                  placeholder={t('offering.description.placeholder')}
                  hint={t('offering.description.hint')}
                  error={errors.businessDescription?.message}
                  required
                  disabled={isLoading}
                  maxLength={500}
                  minLength={50}
                  showCharacterCount
                />
              )}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Target Audience */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">{t('audience.title')}</h3>
              <Badge variant="outline" className="ml-auto">
                {t('audience.optional')}
              </Badge>
            </div>

            <Controller
              name="targetAudience"
              control={control}
              render={({ field }) => (
                <TextareaInput
                  {...field}
                  label={t('audience.description.label')}
                  placeholder={t('audience.description.placeholder')}
                  hint={t('audience.description.hint')}
                  error={errors.targetAudience?.message}
                  disabled={isLoading}
                  maxLength={300}
                  showCharacterCount
                />
              )}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Unique Value Proposition */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">{t('uniqueness.title')}</h3>
              <Badge variant="secondary" className="ml-auto">
                {t('uniqueness.required')}
              </Badge>
            </div>

            <Controller
              name="uniqueValue"
              control={control}
              render={({ field }) => (
                <TextareaInput
                  {...field}
                  label={t('uniqueness.value.label')}
                  placeholder={t('uniqueness.value.placeholder')}
                  hint={t('uniqueness.value.hint')}
                  error={errors.uniqueValue?.message}
                  required
                  disabled={isLoading}
                  maxLength={200}
                  minLength={20}
                  showCharacterCount
                />
              )}
            />

            <Controller
              name="businessGoals"
              control={control}
              render={({ field }) => (
                <TextareaInput
                  {...field}
                  label={t('uniqueness.goals.label')}
                  placeholder={t('uniqueness.goals.placeholder')}
                  hint={t('uniqueness.goals.hint')}
                  error={errors.businessGoals?.message}
                  disabled={isLoading}
                  maxLength={300}
                  showCharacterCount
                />
              )}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Competitor Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-2">
              <Link className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">{t('competitors.title')}</h3>
              <Badge variant="outline" className="ml-auto">
                {t('competitors.optional')}
              </Badge>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('competitors.description')}
              </p>

              <DynamicList
                label={t('competitors.urls.label')}
                items={competitorUrls.map((url: string, index: number) => ({
                  id: `competitor-${index}`,
                  value: url,
                  order: index
                }))}
                placeholder={t('competitors.urls.placeholder')}
                addButtonText={t('competitors.urls.addButton')}
                hint={t('competitors.urls.hint')}
                error={errors.competitorUrls?.message}
                maxItems={5}
                minItems={0}
                itemPrefix="🌐"
                showCounter
                disabled={isLoading}
                onItemsChange={handleCompetitorUrlsChange}
              />
            </div>

            <Controller
              name="competitorAnalysis"
              control={control}
              render={({ field }) => (
                <TextareaInput
                  {...field}
                  label={t('competitors.analysis.label')}
                  placeholder={t('competitors.analysis.placeholder')}
                  hint={t('competitors.analysis.hint')}
                  error={errors.competitorAnalysis?.message}
                  disabled={isLoading}
                  maxLength={400}
                  showCharacterCount
                />
              )}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Brand Keywords */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <h4 className="font-medium text-sm text-foreground">{t('keywords.title')}</h4>
            </div>
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>{t('keywords.description')}</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>{t('keywords.examples.professional')}</li>
                <li>{t('keywords.examples.innovative')}</li>
                <li>{t('keywords.examples.reliable')}</li>
                <li>{t('keywords.examples.creative')}</li>
              </ul>
            </div>

            <Controller
              name="brandKeywords"
              control={control}
              render={({ field }) => (
                <TextInput
                  {...field}
                  label={t('keywords.input.label')}
                  placeholder={t('keywords.input.placeholder')}
                  hint={t('keywords.input.hint')}
                  error={errors.brandKeywords?.message}
                  disabled={isLoading}
                />
              )}
            />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}