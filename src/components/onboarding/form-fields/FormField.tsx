/**
 * FormField: Universal wrapper component for form inputs
 *
 * Features:
 * - React Hook Form Controller integration
 * - Label with htmlFor association
 * - Validation error display
 * - Required field indicator (*)
 * - Optional description text
 * - Full ARIA accessibility support
 * - Design token-based styling
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface FormFieldProps {
  /** Field name for React Hook Form */
  name: string;

  /** Label text displayed above the field */
  label: string;

  /** Optional description text displayed below the label */
  description?: string;

  /** Whether the field is required */
  required?: boolean;

  /** Error message to display (from validation) */
  error?: string;

  /** Input element (child component) */
  children: React.ReactElement;
}

/**
 * FormField component wraps input elements with label, error display, and accessibility features.
 * Integrates seamlessly with React Hook Form for form state management.
 */
export function FormField({
  name,
  label,
  description,
  required = false,
  error,
  children,
}: FormFieldProps) {
  const errorId = `${name}-error`;
  const descriptionId = `${name}-description`;

  // Build aria-describedby value based on what's present
  const ariaDescribedBy = React.useMemo(() => {
    const ids: string[] = [];
    if (error) ids.push(errorId);
    if (description) ids.push(descriptionId);
    return ids.length > 0 ? ids.join(' ') : undefined;
  }, [error, description, errorId, descriptionId]);

  // Clone child element and add ARIA attributes
  const childWithProps = React.cloneElement(children, {
    id: name,
    'aria-required': required ? 'true' : undefined,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': error ? 'true' : undefined,
  } as any);

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

      {/* Input element */}
      <div>{childWithProps}</div>

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
    </div>
  );
}
