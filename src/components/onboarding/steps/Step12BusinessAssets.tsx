'use client'

import { useTranslations } from 'next-intl'
import { Controller } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Upload, Image as ImageIcon, AlertCircle, CheckCircle2 } from 'lucide-react'

import { FileUpload } from '@/components/onboarding/form-fields/FileUpload'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { StepComponentProps } from './index'

export function Step12BusinessAssets({ form, errors, isLoading }: StepComponentProps) {
  const t = useTranslations('onboarding.steps.12')
  const { control, watch } = form

  const businessLogo = watch('businessLogo')
  const businessPhotos = watch('businessPhotos') || []

  return (
    <div className="space-y-8">
      {/* Introduction */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
          <Upload className="w-8 h-8 text-primary" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">{t('intro.title')}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
            {t('intro.description')}
          </p>
        </div>
      </motion.div>

      {/* Business Logo Upload */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">{t('logo.title')}</h3>
              <Badge variant="outline" className="ml-auto">
                {t('logo.optional')}
              </Badge>
            </div>

            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {t('logo.guidelines')}
                </AlertDescription>
              </Alert>

              <Controller
                name="businessLogo"
                control={control}
                render={({ field }) => (
                  <FileUpload
                    label={t('logo.upload.label')}
                    accept={{
                      'image/png': ['.png'],
                      'image/jpeg': ['.jpg', '.jpeg'],
                      'image/svg+xml': ['.svg']
                    }}
                    maxSize={2 * 1024 * 1024} // 2MB
                    multiple={false}
                    onFilesChange={field.onChange}
                    value={field.value}
                    error={errors.businessLogo?.message}
                    hint={t('logo.upload.hint')}
                    disabled={isLoading}
                  />
                )}
              />

              {/* Logo Requirements */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">{t('logo.requirements.title')}</h4>
                <div className="grid md:grid-cols-2 gap-3">
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                      {t('logo.requirements.format')}
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                      {t('logo.requirements.size')}
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                      {t('logo.requirements.resolution')}
                    </li>
                  </ul>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                      {t('logo.requirements.background')}
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                      {t('logo.requirements.colors')}
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                      {t('logo.requirements.quality')}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Business Photos Upload */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">{t('photos.title')}</h3>
              <Badge variant="outline" className="ml-auto">
                {t('photos.optional')}
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-sm text-blue-700">{t('photos.benefits.title')}</h4>
                <ul className="text-xs text-blue-600 space-y-1">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                    {t('photos.benefits.trust')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                    {t('photos.benefits.personal')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                    {t('photos.benefits.professional')}
                  </li>
                </ul>
              </div>

              <Controller
                name="businessPhotos"
                control={control}
                render={({ field }) => (
                  <FileUpload
                    label={t('photos.upload.label')}
                    accept={{
                      'image/png': ['.png'],
                      'image/jpeg': ['.jpg', '.jpeg']
                    }}
                    maxSize={5 * 1024 * 1024} // 5MB per file
                    multiple={true}
                    maxFiles={8}
                    onFilesChange={field.onChange}
                    value={field.value}
                    error={errors.businessPhotos?.message}
                    hint={t('photos.upload.hint')}
                    disabled={isLoading}
                  />
                )}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Photo Categories Guide */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-green-700">{t('categories.title')}</h4>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-3">
                <h5 className="font-medium text-green-700">{t('categories.exterior.title')}</h5>
                <ul className="space-y-1 text-green-600">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                    {t('categories.exterior.storefront')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                    {t('categories.exterior.signage')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                    {t('categories.exterior.entrance')}
                  </li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h5 className="font-medium text-green-700">{t('categories.interior.title')}</h5>
                <ul className="space-y-1 text-green-600">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                    {t('categories.interior.workspace')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                    {t('categories.interior.products')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                    {t('categories.interior.atmosphere')}
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h5 className="font-medium text-green-700">{t('categories.team.title')}</h5>
                <ul className="space-y-1 text-green-600">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                    {t('categories.team.owner')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                    {t('categories.team.staff')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                    {t('categories.team.action')}
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h5 className="font-medium text-green-700">{t('categories.services.title')}</h5>
                <ul className="space-y-1 text-green-600">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                    {t('categories.services.process')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                    {t('categories.services.results')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                    {t('categories.services.tools')}
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Upload Summary */}
      {(businessLogo || businessPhotos.length > 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <h4 className="font-medium text-sm">{t('summary.title')}</h4>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <h6 className="font-medium text-muted-foreground">{t('summary.logo')}</h6>
                  <p className="text-xs text-muted-foreground">
                    {businessLogo ? t('summary.uploaded') : t('summary.none')}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h6 className="font-medium text-muted-foreground">{t('summary.photos')}</h6>
                  <p className="text-xs text-muted-foreground">
                    {businessPhotos.length > 0 
                      ? t('summary.photoCount', { count: businessPhotos.length })
                      : t('summary.none')
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quality Guidelines */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
      >
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-purple-700">{t('quality.title')}</h4>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <h5 className="font-medium text-purple-700">{t('quality.lighting.title')}</h5>
                <p className="text-purple-600 text-xs">{t('quality.lighting.description')}</p>
              </div>
              
              <div className="space-y-2">
                <h5 className="font-medium text-purple-700">{t('quality.composition.title')}</h5>
                <p className="text-purple-600 text-xs">{t('quality.composition.description')}</p>
              </div>
              
              <div className="space-y-2">
                <h5 className="font-medium text-purple-700">{t('quality.authenticity.title')}</h5>
                <p className="text-purple-600 text-xs">{t('quality.authenticity.description')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Helper Tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="text-center text-xs text-muted-foreground space-y-2"
      >
        <p>{t('tips.title')}</p>
        <div className="flex flex-wrap justify-center gap-4">
          <span>{t('tips.quality')}</span>
          <span>•</span>
          <span>{t('tips.authentic')}</span>
          <span>•</span>
          <span>{t('tips.variety')}</span>
        </div>
      </motion.div>
    </div>
  )
}