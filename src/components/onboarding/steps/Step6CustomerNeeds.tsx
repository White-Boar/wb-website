'use client'

import { useTranslations } from 'next-intl'
import { Controller } from 'react-hook-form'
import { motion } from 'framer-motion'
import { HelpCircle, Lightbulb, Heart, Target } from 'lucide-react'

import { TextareaInput } from '@/components/onboarding/form-fields/TextareaInput'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StepComponentProps } from './index'

export function Step6CustomerNeeds({ form, errors, isLoading }: StepComponentProps) {
  const t = useTranslations('onboarding.steps.6')
  const { control } = form

  return (
    <div className="space-y-8">
      {/* Introduction */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
          <Target className="w-8 h-8 text-primary" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">{t('intro.title')}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
            {t('intro.description')}
          </p>
        </div>
      </motion.div>

      {/* Customer Problems */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">{t('problems.title')}</h3>
              <Badge variant="secondary" className="ml-auto">
                {t('problems.required')}
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-sm text-primary">{t('problems.examples.title')}</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0" />
                    {t('problems.examples.visibility')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0" />
                    {t('problems.examples.credibility')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0" />
                    {t('problems.examples.competition')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0" />
                    {t('problems.examples.communication')}
                  </li>
                </ul>
              </div>

              <Controller
                name="customerProblems"
                control={control}
                render={({ field }) => (
                  <TextareaInput
                    {...field}
                    label={t('problems.input.label')}
                    placeholder={t('problems.input.placeholder')}
                    hint={t('problems.input.hint')}
                    error={errors.customerProblems?.message}
                    required
                    disabled={isLoading}
                    maxLength={400}
                    minLength={30}
                    showCharacterCount
                  />
                )}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Solutions & Benefits */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">{t('solutions.title')}</h3>
              <Badge variant="secondary" className="ml-auto">
                {t('solutions.required')}
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-sm text-green-700">{t('solutions.examples.title')}</h4>
                <ul className="text-xs text-green-600 space-y-1">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                    {t('solutions.examples.professional')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                    {t('solutions.examples.seo')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                    {t('solutions.examples.mobile')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                    {t('solutions.examples.social')}
                  </li>
                </ul>
              </div>

              <Controller
                name="solutionsBenefits"
                control={control}
                render={({ field }) => (
                  <TextareaInput
                    {...field}
                    label={t('solutions.input.label')}
                    placeholder={t('solutions.input.placeholder')}
                    hint={t('solutions.input.hint')}
                    error={errors.solutionsBenefits?.message}
                    required
                    disabled={isLoading}
                    maxLength={400}
                    minLength={30}
                    showCharacterCount
                  />
                )}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Customer Delight */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">{t('delight.title')}</h3>
              <Badge variant="outline" className="ml-auto">
                {t('delight.optional')}
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-sm text-pink-700">{t('delight.examples.title')}</h4>
                <ul className="text-xs text-pink-600 space-y-1">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-pink-600 mt-2 flex-shrink-0" />
                    {t('delight.examples.surprise')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-pink-600 mt-2 flex-shrink-0" />
                    {t('delight.examples.personal')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-pink-600 mt-2 flex-shrink-0" />
                    {t('delight.examples.exceed')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-pink-600 mt-2 flex-shrink-0" />
                    {t('delight.examples.memorable')}
                  </li>
                </ul>
              </div>

              <Controller
                name="customerDelight"
                control={control}
                render={({ field }) => (
                  <TextareaInput
                    {...field}
                    label={t('delight.input.label')}
                    placeholder={t('delight.input.placeholder')}
                    hint={t('delight.input.hint')}
                    error={errors.customerDelight?.message}
                    disabled={isLoading}
                    maxLength={300}
                    showCharacterCount
                  />
                )}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Customer Journey Insight */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-blue-700">{t('insights.title')}</h4>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <h5 className="font-medium text-blue-700">{t('insights.awareness.title')}</h5>
                <p className="text-blue-600 text-xs">{t('insights.awareness.description')}</p>
              </div>
              
              <div className="space-y-2">
                <h5 className="font-medium text-blue-700">{t('insights.consideration.title')}</h5>
                <p className="text-blue-600 text-xs">{t('insights.consideration.description')}</p>
              </div>
              
              <div className="space-y-2">
                <h5 className="font-medium text-blue-700">{t('insights.decision.title')}</h5>
                <p className="text-blue-600 text-xs">{t('insights.decision.description')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Helper Tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
        className="text-center text-xs text-muted-foreground space-y-2"
      >
        <p>{t('tips.title')}</p>
        <div className="flex flex-wrap justify-center gap-4">
          <span>{t('tips.specific')}</span>
          <span>•</span>
          <span>{t('tips.customer')}</span>
          <span>•</span>
          <span>{t('tips.emotional')}</span>
        </div>
      </motion.div>
    </div>
  )
}