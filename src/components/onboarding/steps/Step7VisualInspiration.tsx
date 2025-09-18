'use client'

import { useTranslations } from 'next-intl'
import { Controller } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Eye, Link, Sparkles, Globe } from 'lucide-react'

import { DynamicList } from '@/components/onboarding/DynamicList'
import { TextareaInput } from '@/components/onboarding/form-fields/TextareaInput'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StepComponentProps } from './index'

export function Step7VisualInspiration({ form, errors, isLoading }: StepComponentProps) {
  const t = useTranslations('onboarding.steps.7')
  const { control, setValue, watch } = form

  const inspirationUrls = watch('inspirationUrls') || []

  const handleInspirationsChange = (items: any[]) => {
    const urls = items.map(item => item.value)
    setValue('inspirationUrls', urls)
  }

  // Sample inspiration categories for quick access
  const inspirationCategories = [
    { name: t('categories.restaurant'), urls: ['https://restaurant-example.com', 'https://food-example.com'] },
    { name: t('categories.retail'), urls: ['https://shop-example.com', 'https://boutique-example.com'] },
    { name: t('categories.professional'), urls: ['https://lawyer-example.com', 'https://consultant-example.com'] },
    { name: t('categories.creative'), urls: ['https://agency-example.com', 'https://portfolio-example.com'] }
  ]

  const addSampleUrl = (url: string) => {
    const currentUrls = inspirationUrls.map((item: any) => 
      typeof item === 'string' ? item : item.value
    )
    
    if (!currentUrls.includes(url)) {
      const newUrls = [...currentUrls, url]
      setValue('inspirationUrls', newUrls)
    }
  }

  return (
    <div className="space-y-8">
      {/* Introduction */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
          <Eye className="w-8 h-8 text-primary" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">{t('intro.title')}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
            {t('intro.description')}
          </p>
        </div>
      </motion.div>

      {/* Website Inspirations */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-2">
              <Link className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">{t('inspirations.title')}</h3>
              <Badge variant="outline" className="ml-auto">
                {t('inspirations.optional')}
              </Badge>
            </div>

            <div className="space-y-6">
              {/* Guidelines */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-sm text-blue-700">{t('inspirations.guidelines.title')}</h4>
                <div className="grid md:grid-cols-2 gap-3">
                  <ul className="text-xs text-blue-600 space-y-1">
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                      {t('inspirations.guidelines.layout')}
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                      {t('inspirations.guidelines.colors')}
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                      {t('inspirations.guidelines.typography')}
                    </li>
                  </ul>
                  <ul className="text-xs text-blue-600 space-y-1">
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                      {t('inspirations.guidelines.navigation')}
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                      {t('inspirations.guidelines.images')}
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                      {t('inspirations.guidelines.overall')}
                    </li>
                  </ul>
                </div>
              </div>

              {/* URL Collection */}
              <DynamicList
                label={t('inspirations.urls.label')}
                items={inspirationUrls.map((url: string, index: number) => ({
                  id: `inspiration-${index}`,
                  value: url,
                  order: index
                }))}
                placeholder={t('inspirations.urls.placeholder')}
                addButtonText={t('inspirations.urls.addButton')}
                hint={t('inspirations.urls.hint')}
                error={errors.inspirationUrls?.message}
                maxItems={10}
                minItems={0}
                itemPrefix="🌐"
                showCounter
                allowReorder
                allowEdit
                disabled={isLoading}
                onItemsChange={handleInspirationsChange}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Categories */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-muted-foreground" />
              <h4 className="font-medium text-sm text-foreground">{t('categories.title')}</h4>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {inspirationCategories.map((category, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                  className="text-center space-y-2"
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => {
                      category.urls.forEach(url => addSampleUrl(url))
                    }}
                    disabled={isLoading}
                  >
                    <Globe className="w-3 h-3 mr-1" />
                    {category.name}
                  </Button>
                </motion.div>
              ))}
            </div>
            
            <p className="text-xs text-muted-foreground text-center">
              {t('categories.description')}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Visual Preferences */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">{t('preferences.title')}</h3>
              <Badge variant="outline" className="ml-auto">
                {t('preferences.optional')}
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-sm text-purple-700">{t('preferences.examples.title')}</h4>
                <ul className="text-xs text-purple-600 space-y-1">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-purple-600 mt-2 flex-shrink-0" />
                    {t('preferences.examples.clean')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-purple-600 mt-2 flex-shrink-0" />
                    {t('preferences.examples.bold')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-purple-600 mt-2 flex-shrink-0" />
                    {t('preferences.examples.professional')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-purple-600 mt-2 flex-shrink-0" />
                    {t('preferences.examples.creative')}
                  </li>
                </ul>
              </div>

              <Controller
                name="visualPreferences"
                control={control}
                render={({ field }) => (
                  <TextareaInput
                    {...field}
                    label={t('preferences.input.label')}
                    placeholder={t('preferences.input.placeholder')}
                    hint={t('preferences.input.hint')}
                    error={errors.visualPreferences?.message}
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

      {/* Design Analysis Insight */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-orange-600" />
              <h4 className="font-semibold text-orange-700">{t('analysis.title')}</h4>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <h5 className="font-medium text-orange-700">{t('analysis.layout.title')}</h5>
                <p className="text-orange-600 text-xs">{t('analysis.layout.description')}</p>
              </div>
              
              <div className="space-y-2">
                <h5 className="font-medium text-orange-700">{t('analysis.content.title')}</h5>
                <p className="text-orange-600 text-xs">{t('analysis.content.description')}</p>
              </div>
              
              <div className="space-y-2">
                <h5 className="font-medium text-orange-700">{t('analysis.interaction.title')}</h5>
                <p className="text-orange-600 text-xs">{t('analysis.interaction.description')}</p>
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
          <span>{t('tips.diverse')}</span>
          <span>•</span>
          <span>{t('tips.specific')}</span>
          <span>•</span>
          <span>{t('tips.relevant')}</span>
        </div>
      </motion.div>
    </div>
  )
}