'use client'

import { useTranslations } from 'next-intl'
import { useCallback } from 'react'

/**
 * Enhanced translation hook that provides fallback handling for missing keys
 * @param namespace - The translation namespace
 * @param fallbackNamespace - Optional fallback namespace
 */
export function useTranslationWithFallback(
  namespace: string,
  fallbackNamespace?: string
) {
  const t = useTranslations(namespace)
  const fallbackT = fallbackNamespace ? useTranslations(fallbackNamespace) : null

  const translate = useCallback((
    key: string,
    values?: Record<string, any>,
    fallbackKey?: string
  ): string => {
    try {
      // First, try the main namespace
      const translation = t(key, values)

      // Check if we got a valid translation (not the key itself)
      if (translation && translation !== key) {
        return translation
      }

      // Try fallback namespace if provided
      if (fallbackT) {
        try {
          const fallbackTranslation = fallbackT(fallbackKey || key, values)
          if (fallbackTranslation && fallbackTranslation !== (fallbackKey || key)) {
            console.warn(`Translation fallback used: ${namespace}.${key} -> ${fallbackNamespace}.${fallbackKey || key}`)
            return fallbackTranslation
          }
        } catch (fallbackError) {
          console.warn(`Fallback translation failed for ${fallbackNamespace}.${fallbackKey || key}:`, fallbackError)
        }
      }

      // If all else fails, return a human-readable version of the key
      const humanReadableKey = key
        .split('.')
        .pop() // Get the last part after dots
        ?.replace(/([A-Z])/g, ' $1') // Add spaces before capital letters
        ?.replace(/^./, str => str.toUpperCase()) // Capitalize first letter
        ?.trim() || key

      console.warn(`Missing translation: ${namespace}.${key}, using fallback: "${humanReadableKey}"`)
      return humanReadableKey

    } catch (error) {
      console.error(`Translation error for ${namespace}.${key}:`, error)

      // Return a safe fallback
      const safeKey = key.split('.').pop() || key
      return safeKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()
    }
  }, [t, fallbackT, namespace, fallbackNamespace])

  // Also provide the original translate function for direct access when needed
  const translateRaw = useCallback((key: string, values?: Record<string, any>) => {
    try {
      return t(key, values)
    } catch (error) {
      console.error(`Raw translation error for ${namespace}.${key}:`, error)
      return key
    }
  }, [t, namespace])

  // Check if a translation key exists
  const hasTranslation = useCallback((key: string): boolean => {
    try {
      const translation = t(key)
      return translation !== key && Boolean(translation)
    } catch {
      return false
    }
  }, [t])

  return {
    t: translate,
    tRaw: translateRaw,
    hasTranslation
  }
}

/**
 * Quick helper for forms namespace with generic fallback
 */
export function useFormTranslation() {
  return useTranslationWithFallback('forms', 'common')
}

/**
 * Quick helper for onboarding steps with forms fallback
 */
export function useOnboardingStepTranslation(stepNumber: number) {
  return useTranslationWithFallback(`onboarding.steps.${stepNumber}`, 'forms')
}