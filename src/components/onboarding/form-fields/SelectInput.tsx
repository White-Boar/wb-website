/**
 * SelectInput: Dropdown select component using shadcn/ui
 */

'use client';

import * as React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectInputProps {
  name: string;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  description?: string;
  required?: boolean;
  error?: string;
}

export function SelectInput({
  name,
  label,
  options,
  placeholder = 'Select an option',
  description,
  required = false,
  error,
}: SelectInputProps) {
  const { control } = useFormContext();
  const errorId = `${name}-error`;
  const descriptionId = `${name}-description`;
  const ariaDescribedBy = React.useMemo(() => {
    const ids: string[] = [];
    if (error) ids.push(errorId);
    if (description) ids.push(descriptionId);
    return ids.length > 0 ? ids.join(' ') : undefined;
  }, [error, description, errorId, descriptionId]);

  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-medium text-gray-900 dark:text-gray-100">
        {label}
        {required && <span className="ml-1 text-destructive" aria-label="required">*</span>}
      </label>
      {description && <p id={descriptionId} className="text-sm text-gray-600 dark:text-gray-400">{description}</p>}
      <Controller name={name} control={control} render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger id={name} aria-describedby={ariaDescribedBy} aria-required={required ? 'true' : undefined} aria-invalid={error ? 'true' : undefined} className="w-full">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {error && <p id={errorId} role="alert" aria-live="polite" className="text-sm text-destructive error-message">{error}</p>}
    </div>
  );
}
