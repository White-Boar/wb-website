'use client'

import { useState, useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Controller } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Palette, Sparkles, Eye, Search, X } from 'lucide-react'

import { ColorPalette } from '@/components/onboarding/ColorPalette'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { StepComponentProps } from './index'
import { getColorPalettes } from '@/lib/color-palettes'
import colorPalettesData from '@/data/color_palettes.json'

export function Step10ColorPalette({ form, errors, isLoading }: StepComponentProps) {
  const t = useTranslations('onboarding.steps.10')
  const locale = useLocale()
  const { control } = form
  const [searchQuery, setSearchQuery] = useState('')

  // Load color palettes based on current locale
  const allColorPalettes = getColorPalettes(locale)

  // Filter palettes based on search query
  const filteredPalettes = useMemo(() => {
    if (!searchQuery.trim()) {
      return allColorPalettes
    }

    const query = searchQuery.toLowerCase().trim()
    const isItalian = locale === 'it'

    return allColorPalettes.filter((palette, index) => {
      const rawPalette = colorPalettesData[index]

      // Search in palette names (both locales)
      if (rawPalette.palette_name_en.toLowerCase().includes(query) ||
          rawPalette.palette_name_it.toLowerCase().includes(query)) {
        return true
      }

      // Search in descriptions (both locales)
      if (rawPalette.description_en.toLowerCase().includes(query) ||
          rawPalette.description_it.toLowerCase().includes(query)) {
        return true
      }

      // Search in main colors (both locales)
      const mainColorsEn = rawPalette.main_colors_en.some(color =>
        color.toLowerCase().includes(query)
      )
      const mainColorsIt = rawPalette.main_colors_it.some(color =>
        color.toLowerCase().includes(query)
      )

      return mainColorsEn || mainColorsIt
    })
  }, [searchQuery, allColorPalettes, locale])

  const colorPaletteOptions = filteredPalettes

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
              <h2 className="text-lg font-semibold text-foreground">{t('selection.title')}</h2>
              <Badge variant="secondary" className="ml-auto">
                {t('selection.required')}
              </Badge>
            </div>

            {/* Search Bar */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={locale === 'it'
                    ? 'Cerca palette per nome, colore o descrizione...'
                    : 'Search palettes by name, color, or description...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9"
                />
                {searchQuery && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {searchQuery && (
                <p className="text-sm text-muted-foreground">
                  {locale === 'it'
                    ? `${filteredPalettes.length} palette ${filteredPalettes.length === 1 ? 'trovata' : 'trovate'}`
                    : `${filteredPalettes.length} ${filteredPalettes.length === 1 ? 'palette' : 'palettes'} found`}
                </p>
              )}
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
                  error={(errors as any).colorPalette?.message}
                  showNames
                  showDescriptions
                  showCategories={false}
                  showPreview
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
        className="text-center text-sm text-muted-foreground space-y-2"
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