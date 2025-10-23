'use client'

import { useTranslations } from 'next-intl'
import { Controller } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Camera, Image as ImageIcon, Sparkles } from 'lucide-react'

import { ImageGrid } from '@/components/onboarding/ImageGrid'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StepComponentProps } from './index'

// Image style options
const imageStyleOptions = [
  {
    id: 'photorealistic',
    title: 'Photorealistic',
    description: 'High-quality, professional photographs with clean composition',
    imageUrl: '/images/onboarding/image-photorealistic.png',
    category: 'Photorealistic',
    tags: ['High-quality', 'Professional', 'Clean', 'Authentic'],
    premium: false
  },
  {
    id: 'flat-illustration',
    title: 'Flat Illustration',
    description: 'Modern flat design illustrations with clean vector graphics',
    imageUrl: '/images/onboarding/image-flat-illustration.png',
    category: 'Flat Illustration',
    tags: ['Vector', 'Clean', 'Contemporary', 'Scalable'],
    premium: false
  },
  {
    id: 'sketch',
    title: 'Sketch Style',
    description: 'Artistic hand-drawn illustrations with personal, creative touch',
    imageUrl: '/images/onboarding/image-sketch.png',
    category: 'Sketch Style',
    tags: ['Artistic', 'Personal', 'Creative', 'Unique'],
    premium: true
  },
  {
    id: '3d',
    title: '3D Rendered',
    description: 'Modern 3D rendered graphics for dynamic visual impact',
    imageUrl: '/images/onboarding/image-3d.png',
    category: '3D Rendered',
    tags: ['Dynamic', 'Modern', 'Dimensional', 'Engaging'],
    premium: false
  },
  {
    id: 'line-art',
    title: 'Line Art',
    description: 'Simple, clean line art with focus on essential elements only',
    imageUrl: '/images/onboarding/image-line-art.png',
    category: 'Line Art',
    tags: ['Simple', 'Clean', 'Focused', 'Elegant'],
    premium: false
  },
  {
    id: 'collage',
    title: 'Collage Style',
    description: 'Creative combination of elements for unique visual storytelling',
    imageUrl: '/images/onboarding/image-collage.png',
    category: 'Collage Style',
    tags: ['Creative', 'Versatile', 'Artistic', 'Storytelling'],
    premium: false
  }
]

export function Step9ImageStyle({ form, errors, isLoading }: StepComponentProps) {
  const t = useTranslations('onboarding.steps.9')
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
          <Camera className="w-8 h-8 text-primary" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">{t('intro.title')}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
            {t('intro.description')}
          </p>
        </div>
      </motion.div>

      {/* Image Style Selection */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">{t('selection.title')}</h2>
              <Badge variant="secondary" className="ml-auto">
                {t('selection.required')}
              </Badge>
            </div>

            <Controller
              name="imageStyle"
              control={control}
              render={({ field }) => (
                <ImageGrid
                  label=""
                  options={imageStyleOptions}
                  value={field.value}
                  onSelectionChange={field.onChange}
                  error={errors.imageStyle?.message}
                  multiple={false}
                  columns={2}
                  aspectRatio="landscape"
                  showTitles
                  showDescriptions
                  showCategories={false}
                />
              )}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Visual Impact Guide */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-green-700">{t('impact.title')}</h4>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-3">
                <h5 className="font-medium text-green-700">{t('impact.psychology.title')}</h5>
                <ul className="space-y-1 text-green-600">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                    {t('impact.psychology.trust')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                    {t('impact.psychology.emotion')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                    {t('impact.psychology.attention')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                    {t('impact.psychology.memory')}
                  </li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h5 className="font-medium text-green-700">{t('impact.technical.title')}</h5>
                <ul className="space-y-1 text-green-600">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                    {t('impact.technical.loading')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                    {t('impact.technical.scalability')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                    {t('impact.technical.responsive')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                    {t('impact.technical.accessibility')}
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Style Combinations */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-muted-foreground" />
              <h4 className="font-medium text-sm text-foreground">{t('combinations.title')}</h4>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h6 className="font-medium text-muted-foreground">{t('combinations.business.title')}</h6>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">• {t('combinations.business.professional')}</p>
                    <p className="text-muted-foreground">• {t('combinations.business.clean')}</p>
                    <p className="text-muted-foreground">• {t('combinations.business.mixed')}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h6 className="font-medium text-muted-foreground">{t('combinations.creative.title')}</h6>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">• {t('combinations.creative.handDrawn')}</p>
                    <p className="text-muted-foreground">• {t('combinations.creative.lifestyle')}</p>
                    <p className="text-muted-foreground">• {t('combinations.creative.modern')}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <h6 className="font-medium text-muted-foreground">{t('combinations.hospitality.title')}</h6>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">• {t('combinations.hospitality.lifestyle')}</p>
                    <p className="text-muted-foreground">• {t('combinations.hospitality.professional')}</p>
                    <p className="text-muted-foreground">• {t('combinations.hospitality.warm')}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h6 className="font-medium text-muted-foreground">{t('combinations.tech.title')}</h6>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">• {t('combinations.tech.modern')}</p>
                    <p className="text-muted-foreground">• {t('combinations.tech.minimalist')}</p>
                    <p className="text-muted-foreground">• {t('combinations.tech.mixed')}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Content Strategy Note */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-blue-600" />
              <h4 className="font-medium text-blue-700">{t('strategy.title')}</h4>
            </div>
            
            <p className="text-sm text-blue-600">
              {t('strategy.description')}
            </p>
            
            <ul className="text-xs text-blue-600 space-y-1">
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                {t('strategy.consistency')}
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                {t('strategy.quality')}
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                {t('strategy.relevance')}
              </li>
            </ul>
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
          <span>{t('tips.brand')}</span>
          <span>•</span>
          <span>{t('tips.audience')}</span>
          <span>•</span>
          <span>{t('tips.quality')}</span>
        </div>
      </motion.div>
    </div>
  )
}