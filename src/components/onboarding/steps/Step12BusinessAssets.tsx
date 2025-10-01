'use client'

import { useTranslations } from 'next-intl'
import { Controller } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Upload, Image as ImageIcon, AlertCircle, CheckCircle2 } from 'lucide-react'

import { FileUploadWithProgress, FileUploadProgress } from '@/components/onboarding/FileUploadWithProgress'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { StepComponentProps } from './index'
import { useOnboardingStore } from '@/stores/onboarding'

export function Step12BusinessAssets({ form, errors, isLoading }: StepComponentProps) {
  const t = useTranslations('onboarding.steps.12')
  const { control, watch } = form
  const sessionId = useOnboardingStore((state) => state.sessionId)

  const businessLogo = watch('logoUpload')
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
          <h2 className="text-xl font-semibold text-foreground">{t('intro.title')}</h2>
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
              <h3 className="text-lg font-semibold text-foreground">{t('logo.title')}</h3>
              <Badge variant="outline" className="ml-auto">
                {t('logo.optional')}
              </Badge>
            </div>

            <div className="space-y-4">
              <Alert role="note" aria-labelledby="logo-guidelines">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm" id="logo-guidelines">
                  {t('logo.guidelines')}
                </AlertDescription>
              </Alert>

              <Controller
                name="logoUpload"
                control={control}
                render={({ field }) => (
                  <FileUploadWithProgress
                    label={t('logo.upload.label')}
                    description={t('logo.upload.hint')}
                    accept={['image/png', 'image/jpeg', 'image/svg+xml']}
                    maxFiles={1}
                    maxFileSize={2 * 1024 * 1024} // 2MB
                    sessionId={sessionId || undefined}
                    onFilesChange={(files: FileUploadProgress[]) => {
                      // Convert to the expected format
                      const completedFile = files.find(f => f.status === 'completed')
                      field.onChange(completedFile ? {
                        id: completedFile.id,
                        fileName: completedFile.file.name,
                        fileSize: completedFile.file.size,
                        mimeType: completedFile.file.type,
                        url: completedFile.url!,
                        uploadedAt: new Date().toISOString()
                      } : null)
                    }}
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
              <h3 className="text-lg font-semibold text-foreground">{t('photos.title')}</h3>
              <Badge variant="outline" className="ml-auto">
                {t('photos.optional')}
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-sm text-primary">{t('photos.benefits.title')}</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0" />
                    {t('photos.benefits.trust')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0" />
                    {t('photos.benefits.personal')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0" />
                    {t('photos.benefits.professional')}
                  </li>
                </ul>
              </div>

              <Controller
                name="businessPhotos"
                control={control}
                render={({ field }) => (
                  <FileUploadWithProgress
                    label={t('photos.upload.label')}
                    description={t('photos.upload.hint')}
                    accept={['image/png', 'image/jpeg']}
                    maxFiles={30}
                    maxFileSize={10 * 1024 * 1024} // 10MB per file
                    sessionId={sessionId || undefined}
                    onFilesChange={(files: FileUploadProgress[]) => {
                      // Convert completed files to expected format
                      const completedFiles = files
                        .filter(f => f.status === 'completed')
                        .map(f => ({
                          id: f.id,
                          fileName: f.file.name,
                          fileSize: f.file.size,
                          mimeType: f.file.type,
                          url: f.url!,
                          uploadedAt: new Date().toISOString()
                        }))
                      field.onChange(completedFiles)
                    }}
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
        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-accent-foreground" />
              <h4 className="font-semibold text-foreground">{t('categories.title')}</h4>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-3">
                <h5 className="font-medium text-foreground">{t('categories.exterior.title')}</h5>
                <ul className="space-y-1 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-accent mt-2 flex-shrink-0" />
                    {t('categories.exterior.storefront')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-accent mt-2 flex-shrink-0" />
                    {t('categories.exterior.signage')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-accent mt-2 flex-shrink-0" />
                    {t('categories.exterior.entrance')}
                  </li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h5 className="font-medium text-foreground">{t('categories.interior.title')}</h5>
                <ul className="space-y-1 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-accent mt-2 flex-shrink-0" />
                    {t('categories.interior.workspace')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-accent mt-2 flex-shrink-0" />
                    {t('categories.interior.products')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-accent mt-2 flex-shrink-0" />
                    {t('categories.interior.atmosphere')}
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h5 className="font-medium text-foreground">{t('categories.team.title')}</h5>
                <ul className="space-y-1 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-accent mt-2 flex-shrink-0" />
                    {t('categories.team.owner')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-accent mt-2 flex-shrink-0" />
                    {t('categories.team.staff')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-accent mt-2 flex-shrink-0" />
                    {t('categories.team.action')}
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h5 className="font-medium text-foreground">{t('categories.services.title')}</h5>
                <ul className="space-y-1 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-accent mt-2 flex-shrink-0" />
                    {t('categories.services.process')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-accent mt-2 flex-shrink-0" />
                    {t('categories.services.results')}
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-accent mt-2 flex-shrink-0" />
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
                <CheckCircle2 className="w-4 h-4 text-accent-foreground" />
                <h4 className="font-medium text-sm text-foreground">{t('summary.title')}</h4>
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
        <Card className="bg-muted/20 border-muted">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-muted-foreground" />
              <h4 className="font-semibold text-foreground">{t('quality.title')}</h4>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <h5 className="font-medium text-foreground">{t('quality.lighting.title')}</h5>
                <p className="text-muted-foreground text-xs">{t('quality.lighting.description')}</p>
              </div>
              
              <div className="space-y-2">
                <h5 className="font-medium text-foreground">{t('quality.composition.title')}</h5>
                <p className="text-muted-foreground text-xs">{t('quality.composition.description')}</p>
              </div>
              
              <div className="space-y-2">
                <h5 className="font-medium text-foreground">{t('quality.authenticity.title')}</h5>
                <p className="text-muted-foreground text-xs">{t('quality.authenticity.description')}</p>
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