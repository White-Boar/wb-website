/**
 * TextInput: Standard text/password input component
 *
 * Features:
 * - Text and password input types
 * - Character counter for maxLength
 * - AutoComplete support
 * - React Hook Form Controller integration
 * - FormField wrapper for label/error display
 * - Design token-based styling
 * - Full keyboard accessibility
 */

'use client';

import * as React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { cn } from '@/lib/utils';

export interface TextInputProps {
  /** Field name for React Hook Form */
  name: string;

  /** Label text */
  label: string;

  /** Input type: text or password */
  type?: 'text' | 'password';

  /** Placeholder text */
  placeholder?: string;

  /** Maximum character length (shows character counter) */
  maxLength?: number;

  /** AutoComplete attribute for browser autofill */
  autoComplete?: string;

  /** Optional description text */
  description?: string;

  /** Whether the field is required */
  required?: boolean;

  /** Error message from validation */
  error?: string;
}

/**
 * TextInput component wraps a standard input element with FormField.
 * Integrates with React Hook Form for form state management.
 */
export function TextInput({
  name,
  label,
  type = 'text',
  placeholder,
  maxLength,
  autoComplete,
  description,
  required = false,
  error,
}: TextInputProps) {
  const { control, watch } = useFormContext();

  // Watch field value for character counter
  const fieldValue = watch(name) || '';
  const currentLength = typeof fieldValue === 'string' ? fieldValue.length : 0;

  const errorId = `${name}-error`;
  const descriptionId = `${name}-description`;

  // Build aria-describedby
  const ariaDescribedBy = React.useMemo(() => {
    const ids: string[] = [];
    if (error) ids.push(errorId);
    if (description) ids.push(descriptionId);
    return ids.length > 0 ? ids.join(' ') : undefined;
  }, [error, description, errorId, descriptionId]);

  return (
    <div className="space-y-2">
      {/* Label with required indicator */}
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-900 dark:text-gray-100"
      >
        {label}
        {required && (
          <span
            className="ml-1 text-destructive"
            aria-label="required"
          >
            *
          </span>
        )}
      </label>

      {/* Optional description */}
      {description && (
        <p
          id={descriptionId}
          className="text-sm text-gray-600 dark:text-gray-400"
        >
          {description}
        </p>
      )}

      {/* Input with Controller */}
      <div>
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <input
              {...field}
              id={name}
              type={type}
              placeholder={placeholder}
              maxLength={maxLength}
              autoComplete={autoComplete}
              aria-required={required ? 'true' : undefined}
              aria-describedby={ariaDescribedBy}
              aria-invalid={error ? 'true' : undefined}
              className={cn(
                'w-full px-3 py-2 rounded-md border',
                'bg-white dark:bg-gray-900',
                'text-gray-900 dark:text-gray-100',
                'border-gray-300 dark:border-gray-700',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                'placeholder:text-gray-500 dark:placeholder:text-gray-400',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors duration-200',
                error && 'border-destructive focus:ring-destructive'
              )}
            />
          )}
        />
      </div>

      {/* Error message */}
      {error && (
        <p
          id={errorId}
          role="alert"
          aria-live="polite"
          className="text-sm text-destructive error-message"
        >
          {error}
        </p>
      )}

      {/* Character counter */}
      {maxLength && (
        <div className="flex justify-end">
          <span className="text-xs text-gray-600 dark:text-gray-400 character-counter">
            {currentLength} / {maxLength} characters
          </span>
        </div>
      )}
    </div>
  );
}
