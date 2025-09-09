'use client'

import { forwardRef, useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

import { TextInput } from './TextInput'
import { cn } from '@/lib/utils'

interface EmailInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  error?: string
  hint?: string
  success?: string
  required?: boolean
  variant?: 'default' | 'floating'
  validateOnBlur?: boolean
  showValidationIcon?: boolean
  onValidationChange?: (isValid: boolean, email: string) => void
}

export const EmailInput = forwardRef<HTMLInputElement, EmailInputProps>(
  ({
    label,
    error,
    hint,
    success,
    required = false,
    variant = 'default',
    validateOnBlur = true,
    showValidationIcon = true,
    onValidationChange,
    onBlur,
    onChange,
    value,
    className,
    ...props
  }, ref) => {
    const t = useTranslations('forms.email')
    const [isValidating, setIsValidating] = useState(false)
    const [internalError, setInternalError] = useState<string>('')
    const [internalSuccess, setInternalSuccess] = useState<string>('')
    const [emailValue, setEmailValue] = useState(value || '')

    // Email validation regex (more comprehensive)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

    // Common email domains for suggestions
    const commonDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
      'icloud.com', 'live.com', 'msn.com', 'aol.com'
    ]

    const validateEmail = (email: string): { isValid: boolean; message?: string } => {
      if (!email) {
        return { isValid: false }
      }

      if (!emailRegex.test(email)) {
        return { 
          isValid: false, 
          message: t('invalid') 
        }
      }

      // Check for common typos in domains
      const domain = email.split('@')[1]
      if (domain) {
        const suggestion = getSuggestion(domain)
        if (suggestion && suggestion !== domain) {
          return {
            isValid: true,
            message: t('didYouMean', { suggestion: email.replace(domain, suggestion) })
          }
        }
      }

      return { 
        isValid: true, 
        message: t('valid') 
      }
    }

    // Simple domain suggestion logic
    const getSuggestion = (domain: string): string | null => {
      const lowerDomain = domain.toLowerCase()
      
      // Common typos
      const typoMap: Record<string, string> = {
        'gmai.com': 'gmail.com',
        'gmial.com': 'gmail.com',
        'gmaill.com': 'gmail.com',
        'yahooo.com': 'yahoo.com',
        'yaho.com': 'yahoo.com',
        'hotmial.com': 'hotmail.com',
        'hotmall.com': 'hotmail.com',
        'outlok.com': 'outlook.com'
      }

      return typoMap[lowerDomain] || null
    }

    const handleValidation = async (email: string) => {
      if (!validateOnBlur || !email) return

      setIsValidating(true)
      setInternalError('')
      setInternalSuccess('')

      try {
        // Simulate async validation (could be replaced with actual API call)
        await new Promise(resolve => setTimeout(resolve, 300))
        
        const validation = validateEmail(email)
        
        if (validation.isValid) {
          setInternalSuccess(validation.message || t('valid'))
          onValidationChange?.(true, email)
        } else {
          setInternalError(validation.message || t('invalid'))
          onValidationChange?.(false, email)
        }
      } catch (err) {
        setInternalError(t('validationError'))
        onValidationChange?.(false, email)
      } finally {
        setIsValidating(false)
      }
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const email = e.target.value
      handleValidation(email)
      onBlur?.(e)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const email = e.target.value
      setEmailValue(email)
      
      // Clear validation messages on change
      if (internalError || internalSuccess) {
        setInternalError('')
        setInternalSuccess('')
      }

      onChange?.(e)
    }

    // Update internal value when external value changes
    useEffect(() => {
      setEmailValue(value || '')
    }, [value])

    // Determine which error/success message to show
    const displayError = error || internalError
    const displaySuccess = success || (!displayError && internalSuccess)

    // Determine right icon
    const getRightIcon = () => {
      if (isValidating) {
        return <Loader2 className="w-4 h-4 animate-spin" />
      }
      
      if (!showValidationIcon) {
        return null
      }

      if (displayError) {
        return <AlertCircle className="w-4 h-4 text-destructive" />
      }
      
      if (displaySuccess && emailValue) {
        return <CheckCircle2 className="w-4 h-4 text-green-600" />
      }

      return null
    }

    return (
      <div className={cn("space-y-1", className)}>
        <TextInput
          ref={ref}
          type="email"
          label={label}
          error={displayError}
          success={displaySuccess}
          hint={hint}
          required={required}
          variant={variant}
          leftIcon={<Mail className="w-4 h-4" />}
          rightIcon={getRightIcon()}
          onBlur={handleBlur}
          onChange={handleChange}
          value={emailValue}
          placeholder={props.placeholder || t('placeholder')}
          autoComplete="email"
          inputMode="email"
          {...props}
        />
      </div>
    )
  }
)

EmailInput.displayName = 'EmailInput'