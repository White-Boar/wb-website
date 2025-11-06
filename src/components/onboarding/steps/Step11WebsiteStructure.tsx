'use client'

import { useTranslations } from 'next-intl'
import { Controller } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Layout, Target, ShoppingBag, Users, FileText } from 'lucide-react'

import { DropdownInput } from '@/components/onboarding/form-fields/DropdownInput'
import { DynamicList } from '@/components/onboarding/DynamicList'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { StepComponentProps } from './index'

// Website section options (ordered alphabetically)
const websiteSections = [
  { id: 'about', label: 'About Us', description: 'Company story and values', essential: true },
  { id: 'contact', label: 'Contact', description: 'Contact information and form', essential: true },
  { id: 'events', label: 'Events', description: 'Upcoming events and activities', essential: false },
  { id: 'portfolio', label: 'Portfolio/Gallery', description: 'Showcase your work', essential: false },
  { id: 'services', label: 'Services/Products', description: 'What you offer', essential: false },
  { id: 'testimonials', label: 'Testimonials', description: 'Customer reviews and feedback', essential: false }
]

// Primary goal options (ordered alphabetically)
const primaryGoalOptions = [
  {
    value: 'other',
    label: 'Other',
    description: 'Custom business objective or mixed goals'
  },
  {
    value: 'phone-call',
    label: 'Phone call',
    description: 'Encourage visitors to call your business'
  },
  {
    value: 'purchase',
    label: 'Purchase product or service',
    description: 'Drive direct sales and transactions'
  },
  {
    value: 'contact-form',
    label: 'Submit contact form',
    description: 'Generate inquiries through contact forms'
  },
  {
    value: 'visit-location',
    label: 'Visit location',
    description: 'Attract customers to your physical location'
  }
]

export function Step11WebsiteStructure({ form, errors, isLoading }: StepComponentProps) {
  const t = useTranslations('onboarding.steps.11')
  const { control, setValue, watch } = form

  const selectedSections = watch('websiteSections') || []
  const primaryGoal = watch('primaryGoal')
  const offerings = watch('offerings') || []

  const handleSectionChange = (sectionId: string, checked: boolean) => {
    const current = selectedSections || []
    const updated = checked
      ? [...current, sectionId]
      : current.filter((id: string) => id !== sectionId)

    setValue('websiteSections', updated as any, { shouldValidate: true, shouldDirty: true })
  }

  const handleOfferingsChange = (items: any[]) => {
    const offeringsList = items.map(item => item.value)
    setValue('offerings', offeringsList, { shouldValidate: true, shouldDirty: true })
  }

  const getRecommendedSections = (goal: string) => {
    const recommendations: Record<string, string[]> = {
      'phone-call': ['contact', 'services', 'about'],
      'contact-form': ['contact', 'services', 'testimonials', 'about'],
      'visit-location': ['contact', 'about', 'services', 'events'],
      'purchase': ['services', 'portfolio', 'testimonials', 'contact'],
      'other': ['about', 'services', 'contact']
    }
    return recommendations[goal] || []
  }

  const recommendedSections = primaryGoal ? getRecommendedSections(primaryGoal) : []

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
          <h2 className="text-xl font-semibold text-foreground">{t('intro.title')}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
            {t('intro.description')}
          </p>
        </div>
      </motion.div>

      {/* Website Sections */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">{t('sections.title')}</h2>
              <Badge variant="secondary" className="ml-auto">
                {t('sections.required')}
              </Badge>
            </div>

            {primaryGoal && recommendedSections.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-sm text-blue-700">
                  {t('sections.recommended.title')} "{primaryGoalOptions.find(opt => opt.value === primaryGoal)?.label}"
                </h4>
                <div className="flex flex-wrap gap-2">
                  {recommendedSections.map((sectionId) => {
                    const section = websiteSections.find(s => s.id === sectionId)
                    return section ? (
                      <Badge key={sectionId} variant="outline" className="text-xs bg-blue-100 border-blue-300">
                        {section.label}
                      </Badge>
                    ) : null
                  })}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid gap-3">
                {websiteSections.map((section) => {
                  const isSelected = selectedSections.includes(section.id as any)
                  const isRecommended = recommendedSections.includes(section.id as any)
                  const isEssential = section.essential

                  return (
                    <motion.div
                      key={section.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * websiteSections.indexOf(section) }}
                      className={`flex items-start space-x-3 p-3 rounded-lg border transition-all ${
                        isSelected ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/20'
                      }`}
                    >
                      <Checkbox
                        id={section.id}
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSectionChange(section.id, checked as boolean)}
                        disabled={isLoading}
                        className="mt-0.5"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Label 
                            htmlFor={section.id}
                            className="font-medium cursor-pointer"
                          >
                            {section.label}
                          </Label>
                          
                          <div className="flex gap-1">
                            {isEssential && (
                              <Badge variant="secondary" className="text-xs">
                                {t('sections.essential')}
                              </Badge>
                            )}
                            {isRecommended && (
                              <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
                                {t('sections.recommended.badge')}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mt-1">
                          {section.description}
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Primary Goal */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">{t('goal.title')}</h2>
              <Badge variant="secondary" className="ml-auto">
                {t('goal.required')}
              </Badge>
            </div>

            <Controller
              name="primaryGoal"
              control={control}
              render={({ field }) => (
                <DropdownInput
                  label={t('goal.selection.label')}
                  placeholder={t('goal.selection.placeholder')}
                  hint={t('goal.selection.hint')}
                  options={primaryGoalOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                  error={(errors as any).primaryGoal?.message}
                  required
                  searchable
                  disabled={isLoading}
                />
              )}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Products/Services Offerings */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">{t('offerings.title')}</h2>
              <Badge variant="outline" className="ml-auto">
                {t('offerings.optional')}
              </Badge>
            </div>

            <div className="space-y-4">
              {/* Offering Type Selection */}
              <Controller
                name="offeringType"
                control={control}
                render={({ field }) => (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">What do you offer?</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'products', label: 'Products', description: 'Physical or digital goods' },
                        { value: 'services', label: 'Services', description: 'Consulting, support, maintenance' },
                        { value: 'both', label: 'Both', description: 'Products and services' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setValue('offeringType', option.value as 'products' | 'services' | 'both', {
                              shouldValidate: true,
                              shouldDirty: true,
                              shouldTouch: true
                            })
                          }}
                          className={`flex flex-col items-center space-y-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                            field.value === option.value
                              ? 'border-primary bg-primary/5'
                              : 'border-muted'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            field.value === option.value
                              ? 'border-primary bg-primary'
                              : 'border-muted-foreground'
                          }`}>
                            {field.value === option.value && (
                              <div className="w-full h-full rounded-full bg-white scale-50" />
                            )}
                          </div>
                          <Label className="cursor-pointer font-medium">{option.label}</Label>
                          <span className="text-xs text-muted-foreground text-center">{option.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              />

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">{t('offerings.examples.title')}</h4>
                <div className="grid md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <ul className="space-y-1">
                    <li>• {t('offerings.examples.consulting')}</li>
                    <li>• {t('offerings.examples.design')}</li>
                    <li>• {t('offerings.examples.development')}</li>
                  </ul>
                  <ul className="space-y-1">
                    <li>• {t('offerings.examples.photography')}</li>
                    <li>• {t('offerings.examples.marketing')}</li>
                    <li>• {t('offerings.examples.training')}</li>
                  </ul>
                </div>
              </div>

              <DynamicList
                label={t('offerings.list.label')}
                items={offerings.map((offering: string, index: number) => ({
                  id: `offering-${index}`,
                  value: offering,
                  order: index
                }))}
                placeholder={t('offerings.list.placeholder')}
                addButtonText={t('offerings.list.addButton')}
                hint={t('offerings.list.hint')}
                error={(errors as any).offerings?.message}
                maxItems={15}
                minItems={0}
                itemPrefix="🛍️"
                showCounter
                allowReorder
                allowEdit
                onItemsChange={handleOfferingsChange}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Structure Insights */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <h4 className="font-semibold text-emerald-700">{t('insights.title')}</h4>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-3">
                <h5 className="font-medium text-emerald-700">{t('insights.navigation.title')}</h5>
                <ul className="space-y-1 text-emerald-600">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-emerald-600 mt-2 flex-shrink-0" />
                    {t('insights.navigation.clear')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-emerald-600 mt-2 flex-shrink-0" />
                    {t('insights.navigation.logical')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-emerald-600 mt-2 flex-shrink-0" />
                    {t('insights.navigation.mobile')}
                  </li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h5 className="font-medium text-emerald-700">{t('insights.conversion.title')}</h5>
                <ul className="space-y-1 text-emerald-600">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-emerald-600 mt-2 flex-shrink-0" />
                    {t('insights.conversion.cta')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-emerald-600 mt-2 flex-shrink-0" />
                    {t('insights.conversion.trust')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-emerald-600 mt-2 flex-shrink-0" />
                    {t('insights.conversion.contact')}
                  </li>
                </ul>
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
        className="text-center text-sm text-muted-foreground space-y-2"
      >
        <p>{t('tips.title')}</p>
        <div className="flex flex-wrap justify-center gap-4">
          <span>{t('tips.essential')}</span>
          <span>•</span>
          <span>{t('tips.goal')}</span>
          <span>•</span>
          <span>{t('tips.simple')}</span>
        </div>
      </motion.div>
    </div>
  )
}