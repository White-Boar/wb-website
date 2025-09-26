'use client'

import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { useReducedMotion } from 'framer-motion'
import { CheckCircle2, Circle, Play } from 'lucide-react'

import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  currentStep: number
  totalSteps?: number
  variant?: 'compact' | 'detailed'
  showLabels?: boolean
  className?: string
}

export function ProgressBar({
  currentStep,
  totalSteps = 12,
  variant = 'compact',
  showLabels = false,
  className
}: ProgressBarProps) {
  const t = useTranslations('onboarding.steps')
  const shouldReduceMotion = useReducedMotion()
  const progressPercentage = (currentStep / totalSteps) * 100

  if (variant === 'detailed') {
    return (
      <DetailedProgressBar
        currentStep={currentStep}
        totalSteps={totalSteps}
        showLabels={showLabels}
        className={className}
      />
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">
          {t('progress', { current: currentStep, total: totalSteps })}
        </span>
        <span className="font-medium text-muted-foreground">
          {Math.round(progressPercentage)}%
        </span>
      </div>
      
      <Progress 
        value={progressPercentage} 
        className="h-2"
        aria-label={t('progressLabel', { step: currentStep, total: totalSteps })}
      />
      
      {/* Step dots for medium+ screens */}
      <div className="hidden md:flex items-center justify-center gap-1">
        {Array.from({ length: totalSteps }, (_, i) => (
          <motion.div
            key={i}
            initial={false}
            animate={{
              scale: shouldReduceMotion ? 1 : (i === currentStep - 1 ? 1.2 : 1),
              opacity: i < currentStep ? 1 : i === currentStep - 1 ? 0.8 : 0.3
            }}
            transition={{ duration: 0.2 }}
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              i < currentStep 
                ? "bg-primary" 
                : i === currentStep - 1 
                  ? "bg-primary/60" 
                  : "bg-muted-foreground/20"
            )}
            aria-label={
              i < currentStep 
                ? t('stepCompleted', { step: i + 1 })
                : i === currentStep - 1
                  ? t('stepCurrent', { step: i + 1 })
                  : t('stepUpcoming', { step: i + 1 })
            }
          />
        ))}
      </div>
    </div>
  )
}

function DetailedProgressBar({
  currentStep,
  totalSteps,
  showLabels,
  className
}: {
  currentStep: number
  totalSteps: number
  showLabels?: boolean
  className?: string
}) {
  const t = useTranslations('onboarding.steps')
  const shouldReduceMotion = useReducedMotion()

  const steps = [
    { key: 'welcome', label: t('welcome') },
    { key: 'verification', label: t('verification') },
    { key: 'business', label: t('business') },
    { key: 'brand', label: t('brand') },
    { key: 'customer-profile', label: t('customerProfile') },
    { key: 'customer-needs', label: t('customerNeeds') },
    { key: 'inspiration', label: t('inspiration') },
    { key: 'design-style', label: t('designStyle') },
    { key: 'image-style', label: t('imageStyle') },
    { key: 'color-palette', label: t('colorPalette') },
    { key: 'website-structure', label: t('websiteStructure') },
    { key: 'business-assets', label: t('businessAssets') }
  ]

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
        {steps.map((step, i) => {
          const stepNumber = i + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          const isUpcoming = stepNumber > currentStep

          return (
            <motion.div
              key={step.key}
              className="flex flex-col items-center gap-2"
              initial={false}
              animate={{
                scale: shouldReduceMotion ? 1 : (isCurrent ? 1.05 : 1),
                opacity: isCompleted ? 1 : isCurrent ? 0.9 : 0.5
              }}
              transition={{ duration: 0.2 }}
            >
              {/* Step Circle */}
              <div
                className={cn(
                  "relative flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200",
                  isCompleted && "bg-primary border-primary text-primary-foreground",
                  isCurrent && "border-primary bg-primary/10 text-primary",
                  isUpcoming && "border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : isCurrent ? (
                  <Play className="w-3 h-3 ml-0.5" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}

                {/* Connector Line */}
                {stepNumber < totalSteps && (
                  <div
                    className={cn(
                      "absolute top-1/2 left-full w-full h-0.5 transform -translate-y-1/2 transition-colors",
                      stepNumber < currentStep ? "bg-primary" : "bg-muted-foreground/20"
                    )}
                    style={{ width: 'calc(100% + 0.5rem)' }}
                  />
                )}
              </div>

              {/* Step Label */}
              {showLabels && (
                <span
                  className={cn(
                    "text-xs text-center font-medium max-w-20 leading-tight",
                    isCompleted && "text-primary",
                    isCurrent && "text-foreground",
                    isUpcoming && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              )}

              {/* Step Number for mobile */}
              <span className="md:hidden text-xs text-muted-foreground">
                {stepNumber}
              </span>
            </motion.div>
          )
        })}
      </div>

      {/* Overall Progress */}
      <div className="space-y-2">
        <Progress 
          value={(currentStep / totalSteps) * 100} 
          className="h-2"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{t('step')} {currentStep}</span>
          <span>{Math.round((currentStep / totalSteps) * 100)}% {t('complete')}</span>
        </div>
      </div>
    </div>
  )
}

// Simplified mobile progress bar
export function MobileProgressBar({ 
  currentStep, 
  totalSteps = 12,
  className
}: { 
  currentStep: number
  totalSteps?: number
  className?: string
}) {
  const t = useTranslations('onboarding')
  const progressPercentage = (currentStep / totalSteps) * 100
  
  return (
    <div className={cn("bg-background/90 backdrop-blur-sm border-b p-4", className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">
          {t('step')} {currentStep} {t('of')} {totalSteps}
        </span>
        <span className="text-sm font-medium text-primary">
          {Math.round(progressPercentage)}%
        </span>
      </div>
      <Progress value={progressPercentage} className="h-1.5" />
    </div>
  )
}