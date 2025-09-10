'use client'

import { useTranslations } from 'next-intl'
import { Controller } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Palette, Layout, Sparkles } from 'lucide-react'

import { ImageGrid } from '@/components/onboarding/ImageGrid'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StepComponentProps } from './index'

// Design style options with sample images
const designStyleOptions = [
  {
    id: 'modern-minimal',
    title: 'Modern Minimal',
    description: 'Clean lines, plenty of whitespace, sophisticated simplicity',
    imageUrl: '/images/design-styles/modern-minimal.jpg',
    category: 'Contemporary',
    tags: ['Clean', 'Simple', 'Professional', 'Spacious'],
    premium: false
  },
  {
    id: 'classic-elegant',
    title: 'Classic Elegant',
    description: 'Timeless design with refined typography and balanced layout',
    imageUrl: '/images/design-styles/classic-elegant.jpg',
    category: 'Traditional',
    tags: ['Timeless', 'Sophisticated', 'Balanced', 'Refined'],
    premium: false
  },
  {
    id: 'bold-creative',
    title: 'Bold & Creative',
    description: 'Dynamic layouts with vibrant colors and creative elements',
    imageUrl: '/images/design-styles/bold-creative.jpg',
    category: 'Creative',
    tags: ['Dynamic', 'Vibrant', 'Artistic', 'Expressive'],
    premium: false
  },
  {
    id: 'corporate-professional',
    title: 'Corporate Professional',
    description: 'Business-focused design with trust-building elements',
    imageUrl: '/images/design-styles/corporate-professional.jpg',
    category: 'Business',
    tags: ['Professional', 'Trustworthy', 'Corporate', 'Structured'],
    premium: false
  },
  {
    id: 'warm-friendly',
    title: 'Warm & Friendly',
    description: 'Approachable design with warm colors and inviting feel',
    imageUrl: '/images/design-styles/warm-friendly.jpg',
    category: 'Welcoming',
    tags: ['Warm', 'Approachable', 'Inviting', 'Personal'],
    premium: false
  },
  {
    id: 'luxury-premium',
    title: 'Luxury Premium',
    description: 'High-end design with premium materials and exclusive feel',
    imageUrl: '/images/design-styles/luxury-premium.jpg',
    category: 'Premium',
    tags: ['Luxury', 'Premium', 'Exclusive', 'High-end'],
    premium: true
  }
]

export function Step8DesignStyle({ form, errors, isLoading }: StepComponentProps) {
  const t = useTranslations('onboarding.steps.8')
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
          <Layout className="w-8 h-8 text-primary" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">{t('intro.title')}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
            {t('intro.description')}
          </p>
        </div>
      </motion.div>

      {/* Style Selection */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">{t('selection.title')}</h3>
              <Badge variant="secondary" className="ml-auto">
                {t('selection.required')}
              </Badge>
            </div>

            <Controller
              name="designStyle"
              control={control}
              render={({ field }) => (
                <ImageGrid
                  label=""
                  options={designStyleOptions}
                  value={field.value}
                  onSelectionChange={field.onChange}
                  error={errors.designStyle?.message}
                  multiple={false}
                  columns={3}
                  aspectRatio="landscape"
                  showTitles
                  showDescriptions
                  showCategories
                  disabled={isLoading}
                />
              )}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Style Characteristics */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h4 className="font-semibold text-indigo-700">{t('characteristics.title')}</h4>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-3">
                <h5 className="font-medium text-indigo-700">{t('characteristics.visual.title')}</h5>
                <ul className="space-y-1 text-indigo-600">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-indigo-600 mt-2 flex-shrink-0" />
                    {t('characteristics.visual.layout')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-indigo-600 mt-2 flex-shrink-0" />
                    {t('characteristics.visual.typography')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-indigo-600 mt-2 flex-shrink-0" />
                    {t('characteristics.visual.spacing')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-indigo-600 mt-2 flex-shrink-0" />
                    {t('characteristics.visual.elements')}
                  </li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h5 className="font-medium text-indigo-700">{t('characteristics.impact.title')}</h5>
                <ul className="space-y-1 text-indigo-600">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-indigo-600 mt-2 flex-shrink-0" />
                    {t('characteristics.impact.perception')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-indigo-600 mt-2 flex-shrink-0" />
                    {t('characteristics.impact.audience')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-indigo-600 mt-2 flex-shrink-0" />
                    {t('characteristics.impact.conversion')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-indigo-600 mt-2 flex-shrink-0" />
                    {t('characteristics.impact.branding')}
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Industry Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Layout className="w-4 h-4 text-muted-foreground" />
              <h4 className="font-medium text-sm">{t('recommendations.title')}</h4>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-2">
                <h6 className="font-medium text-muted-foreground">{t('recommendations.restaurant.title')}</h6>
                <p className="text-muted-foreground">{t('recommendations.restaurant.style')}</p>
              </div>
              
              <div className="space-y-2">
                <h6 className="font-medium text-muted-foreground">{t('recommendations.professional.title')}</h6>
                <p className="text-muted-foreground">{t('recommendations.professional.style')}</p>
              </div>
              
              <div className="space-y-2">
                <h6 className="font-medium text-muted-foreground">{t('recommendations.creative.title')}</h6>
                <p className="text-muted-foreground">{t('recommendations.creative.style')}</p>
              </div>
              
              <div className="space-y-2">
                <h6 className="font-medium text-muted-foreground">{t('recommendations.retail.title')}</h6>
                <p className="text-muted-foreground">{t('recommendations.retail.style')}</p>
              </div>
              
              <div className="space-y-2">
                <h6 className="font-medium text-muted-foreground">{t('recommendations.health.title')}</h6>
                <p className="text-muted-foreground">{t('recommendations.health.style')}</p>
              </div>
              
              <div className="space-y-2">
                <h6 className="font-medium text-muted-foreground">{t('recommendations.luxury.title')}</h6>
                <p className="text-muted-foreground">{t('recommendations.luxury.style')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Helper Tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center text-xs text-muted-foreground space-y-2"
      >
        <p>{t('tips.title')}</p>
        <div className="flex flex-wrap justify-center gap-4">
          <span>{t('tips.authentic')}</span>
          <span>•</span>
          <span>{t('tips.audience')}</span>
          <span>•</span>
          <span>{t('tips.flexible')}</span>
        </div>
      </motion.div>
    </div>
  )
}