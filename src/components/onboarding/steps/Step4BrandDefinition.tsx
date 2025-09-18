'use client'

import { useOnboardingStepTranslation } from '@/hooks/useTranslationWithFallback'
import { Controller } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Target, Link } from 'lucide-react'

import { TextareaInput } from '@/components/onboarding/form-fields/TextareaInput'
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
              <h3 className="text-lg font-semibold text-foreground">Your offer</h3>
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

      {/* Your competitors */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-2">
              <Link className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Your competitors</h3>
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
    </div>
  )
}