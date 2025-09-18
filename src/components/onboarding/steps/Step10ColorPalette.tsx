'use client'

import { useTranslations } from 'next-intl'
import { Controller } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Palette, Sparkles, Eye } from 'lucide-react'

import { ColorPalette } from '@/components/onboarding/ColorPalette'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StepComponentProps } from './index'

// Color palette options
const colorPaletteOptions = [
  {
    id: 'professional-blue',
    name: 'Professional Blue',
    description: 'Trust-building blues with neutral grays for professional services',
    category: 'Professional',
    colors: [
      { name: 'Primary Blue', hex: '#2563eb' },
      { name: 'Light Blue', hex: '#dbeafe' },
      { name: 'Dark Blue', hex: '#1e40af' },
      { name: 'Gray', hex: '#6b7280' },
      { name: 'Light Gray', hex: '#f3f4f6' }
    ],
    preview: {
      primary: '#2563eb',
      secondary: '#6b7280',
      accent: '#1e40af',
      background: '#f3f4f6',
      text: '#374151'
    },
    tags: ['Trustworthy', 'Professional', 'Clean', 'Corporate']
  },
  {
    id: 'warm-orange',
    name: 'Warm Orange',
    description: 'Energetic oranges with warm yellows for creative and welcoming brands',
    category: 'Energetic',
    colors: [
      { name: 'Primary Orange', hex: '#ea580c' },
      { name: 'Light Orange', hex: '#fed7aa' },
      { name: 'Dark Orange', hex: '#c2410c' },
      { name: 'Warm Yellow', hex: '#fbbf24' },
      { name: 'Cream', hex: '#fffbeb' }
    ],
    preview: {
      primary: '#ea580c',
      secondary: '#92400e',
      accent: '#fbbf24',
      background: '#fffbeb',
      text: '#451a03'
    },
    tags: ['Energetic', 'Warm', 'Creative', 'Friendly']
  },
  {
    id: 'nature-green',
    name: 'Nature Green',
    description: 'Fresh greens with earth tones for sustainable and organic brands',
    category: 'Natural',
    colors: [
      { name: 'Primary Green', hex: '#059669' },
      { name: 'Light Green', hex: '#d1fae5' },
      { name: 'Dark Green', hex: '#065f46' },
      { name: 'Earth Brown', hex: '#92400e' },
      { name: 'Natural Cream', hex: '#fefce8' }
    ],
    preview: {
      primary: '#059669',
      secondary: '#6b7280',
      accent: '#92400e',
      background: '#fefce8',
      text: '#064e3b'
    },
    tags: ['Natural', 'Sustainable', 'Fresh', 'Organic']
  },
  {
    id: 'elegant-purple',
    name: 'Elegant Purple',
    description: 'Sophisticated purples with silver accents for luxury and creativity',
    category: 'Luxury',
    colors: [
      { name: 'Primary Purple', hex: '#7c3aed' },
      { name: 'Light Purple', hex: '#ede9fe' },
      { name: 'Dark Purple', hex: '#5b21b6' },
      { name: 'Silver', hex: '#9ca3af' },
      { name: 'Platinum', hex: '#f9fafb' }
    ],
    preview: {
      primary: '#7c3aed',
      secondary: '#9ca3af',
      accent: '#5b21b6',
      background: '#f9fafb',
      text: '#374151'
    },
    tags: ['Luxury', 'Creative', 'Sophisticated', 'Premium']
  },
  {
    id: 'classic-black',
    name: 'Classic Black & White',
    description: 'Timeless black and white with subtle gray accents for elegance',
    category: 'Classic',
    colors: [
      { name: 'Deep Black', hex: '#111827' },
      { name: 'Charcoal', hex: '#374151' },
      { name: 'Medium Gray', hex: '#6b7280' },
      { name: 'Light Gray', hex: '#d1d5db' },
      { name: 'Pure White', hex: '#ffffff' }
    ],
    preview: {
      primary: '#111827',
      secondary: '#6b7280',
      accent: '#374151',
      background: '#ffffff',
      text: '#111827'
    },
    tags: ['Classic', 'Elegant', 'Timeless', 'Minimal']
  },
  {
    id: 'vibrant-pink',
    name: 'Vibrant Pink',
    description: 'Bold pinks with complementary purples for creative and bold brands',
    category: 'Bold',
    colors: [
      { name: 'Primary Pink', hex: '#ec4899' },
      { name: 'Light Pink', hex: '#fce7f3' },
      { name: 'Dark Pink', hex: '#be185d' },
      { name: 'Purple Accent', hex: '#a855f7' },
      { name: 'Soft Lavender', hex: '#f3e8ff' }
    ],
    preview: {
      primary: '#ec4899',
      secondary: '#9333ea',
      accent: '#a855f7',
      background: '#f3e8ff',
      text: '#581c87'
    },
    tags: ['Bold', 'Creative', 'Modern', 'Confident']
  }
]

export function Step10ColorPalette({ form, errors, isLoading }: StepComponentProps) {
  const t = useTranslations('onboarding.steps.10')
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
          <Palette className="w-8 h-8 text-primary" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">{t('intro.title')}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
            {t('intro.description')}
          </p>
        </div>
      </motion.div>

      {/* Color Palette Selection */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">{t('selection.title')}</h3>
              <Badge variant="secondary" className="ml-auto">
                {t('selection.required')}
              </Badge>
            </div>

            <Controller
              name="colorPalette"
              control={control}
              render={({ field }) => (
                <ColorPalette
                  label=""
                  options={colorPaletteOptions}
                  value={field.value}
                  onSelectionChange={field.onChange}
                  error={errors.colorPalette?.message}
                  showNames
                  showDescriptions
                  showCategories
                  showPreview
                  disabled={isLoading}
                />
              )}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Color Psychology */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-violet-600" />
              <h4 className="font-semibold text-violet-700">{t('psychology.title')}</h4>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-3">
                <h5 className="font-medium text-violet-700">{t('psychology.emotional.title')}</h5>
                <ul className="space-y-1 text-violet-600">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-violet-600 mt-2 flex-shrink-0" />
                    {t('psychology.emotional.trust')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-violet-600 mt-2 flex-shrink-0" />
                    {t('psychology.emotional.energy')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-violet-600 mt-2 flex-shrink-0" />
                    {t('psychology.emotional.calm')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-violet-600 mt-2 flex-shrink-0" />
                    {t('psychology.emotional.luxury')}
                  </li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h5 className="font-medium text-violet-700">{t('psychology.business.title')}</h5>
                <ul className="space-y-1 text-violet-600">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-violet-600 mt-2 flex-shrink-0" />
                    {t('psychology.business.conversion')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-violet-600 mt-2 flex-shrink-0" />
                    {t('psychology.business.branding')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-violet-600 mt-2 flex-shrink-0" />
                    {t('psychology.business.accessibility')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-violet-600 mt-2 flex-shrink-0" />
                    {t('psychology.business.recognition')}
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Industry Color Trends */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-muted-foreground" />
              <h4 className="font-medium text-sm text-foreground">{t('trends.title')}</h4>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-2">
                <h6 className="font-medium text-muted-foreground">{t('trends.finance.title')}</h6>
                <div className="flex gap-1">
                  <div className="w-4 h-4 rounded bg-blue-600"></div>
                  <div className="w-4 h-4 rounded bg-green-600"></div>
                  <div className="w-4 h-4 rounded bg-gray-600"></div>
                </div>
                <p className="text-muted-foreground">{t('trends.finance.description')}</p>
              </div>
              
              <div className="space-y-2">
                <h6 className="font-medium text-muted-foreground">{t('trends.health.title')}</h6>
                <div className="flex gap-1">
                  <div className="w-4 h-4 rounded bg-green-500"></div>
                  <div className="w-4 h-4 rounded bg-blue-400"></div>
                  <div className="w-4 h-4 rounded bg-teal-500"></div>
                </div>
                <p className="text-muted-foreground">{t('trends.health.description')}</p>
              </div>
              
              <div className="space-y-2">
                <h6 className="font-medium text-muted-foreground">{t('trends.food.title')}</h6>
                <div className="flex gap-1">
                  <div className="w-4 h-4 rounded bg-orange-500"></div>
                  <div className="w-4 h-4 rounded bg-red-500"></div>
                  <div className="w-4 h-4 rounded bg-yellow-500"></div>
                </div>
                <p className="text-muted-foreground">{t('trends.food.description')}</p>
              </div>
              
              <div className="space-y-2">
                <h6 className="font-medium text-muted-foreground">{t('trends.tech.title')}</h6>
                <div className="flex gap-1">
                  <div className="w-4 h-4 rounded bg-purple-600"></div>
                  <div className="w-4 h-4 rounded bg-blue-600"></div>
                  <div className="w-4 h-4 rounded bg-gray-800"></div>
                </div>
                <p className="text-muted-foreground">{t('trends.tech.description')}</p>
              </div>
              
              <div className="space-y-2">
                <h6 className="font-medium text-muted-foreground">{t('trends.fashion.title')}</h6>
                <div className="flex gap-1">
                  <div className="w-4 h-4 rounded bg-pink-500"></div>
                  <div className="w-4 h-4 rounded bg-black"></div>
                  <div className="w-4 h-4 rounded bg-purple-400"></div>
                </div>
                <p className="text-muted-foreground">{t('trends.fashion.description')}</p>
              </div>
              
              <div className="space-y-2">
                <h6 className="font-medium text-muted-foreground">{t('trends.education.title')}</h6>
                <div className="flex gap-1">
                  <div className="w-4 h-4 rounded bg-blue-500"></div>
                  <div className="w-4 h-4 rounded bg-green-500"></div>
                  <div className="w-4 h-4 rounded bg-orange-400"></div>
                </div>
                <p className="text-muted-foreground">{t('trends.education.description')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Color Accessibility Note */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-600" />
              <h4 className="font-medium text-amber-700">{t('accessibility.title')}</h4>
            </div>
            
            <p className="text-sm text-amber-600">
              {t('accessibility.description')}
            </p>
            
            <ul className="text-xs text-amber-600 space-y-1">
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-amber-600 mt-2 flex-shrink-0" />
                {t('accessibility.contrast')}
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-amber-600 mt-2 flex-shrink-0" />
                {t('accessibility.colorBlind')}
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-amber-600 mt-2 flex-shrink-0" />
                {t('accessibility.consistency')}
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
          <span>{t('tips.emotion')}</span>
          <span>•</span>
          <span>{t('tips.industry')}</span>
          <span>•</span>
          <span>{t('tips.accessible')}</span>
        </div>
      </motion.div>
    </div>
  )
}