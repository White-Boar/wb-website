/**
 * Unit tests for FormField universal wrapper component
 * Tests React Hook Form integration, accessibility, error display
 */

import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { FormField } from '@/components/onboarding/form-fields/FormField';

// Test wrapper with React Hook Form context
function TestWrapper({ children, defaultValues = {} }: { children: React.ReactNode; defaultValues?: any }) {
  const methods = useForm({ defaultValues });
  return <FormProvider {...methods}>{children}</FormProvider>;
}

describe('FormField Component', () => {
  describe('Basic Rendering', () => {
    test('renders label with proper htmlFor association', () => {
      render(
        <TestWrapper>
          <FormField name="testField" label="Test Label">
            <input id="testField" />
          </FormField>
        </TestWrapper>
      );

      const label = screen.getByText('Test Label');
      expect(label).toBeInTheDocument();
      expect(label.tagName).toBe('LABEL');
      expect(label).toHaveAttribute('for', 'testField');
    });

    test('renders children inside field wrapper', () => {
      render(
        <TestWrapper>
          <FormField name="testField" label="Test Label">
            <input data-testid="test-input" />
          </FormField>
        </TestWrapper>
      );

      expect(screen.getByTestId('test-input')).toBeInTheDocument();
    });

    test('displays optional description text when provided', () => {
      const description = 'This is a helpful description';
      render(
        <TestWrapper>
          <FormField name="testField" label="Test Label" description={description}>
            <input />
          </FormField>
        </TestWrapper>
      );

      expect(screen.getByText(description)).toBeInTheDocument();
    });

    test('does not display description when not provided', () => {
      const { container } = render(
        <TestWrapper>
          <FormField name="testField" label="Test Label">
            <input />
          </FormField>
        </TestWrapper>
      );

      // Look for any element with description text class or role
      const descriptionElements = container.querySelectorAll('[class*="description"]');
      expect(descriptionElements.length).toBe(0);
    });
  });

  describe('Required Field Indicator', () => {
    test('shows required indicator (*) when required prop is true', () => {
      render(
        <TestWrapper>
          <FormField name="testField" label="Test Label" required>
            <input />
          </FormField>
        </TestWrapper>
      );

      // Look for asterisk or "required" text
      const label = screen.getByText(/Test Label/);
      expect(label.textContent).toContain('*');
    });

    test('does not show required indicator when required prop is false', () => {
      render(
        <TestWrapper>
          <FormField name="testField" label="Test Label" required={false}>
            <input />
          </FormField>
        </TestWrapper>
      );

      const label = screen.getByText('Test Label');
      expect(label.textContent).not.toContain('*');
    });
  });

  describe('Error Display', () => {
    test('displays validation error message when error prop provided', () => {
      const errorMessage = 'This field is required';
      render(
        <TestWrapper>
          <FormField name="testField" label="Test Label" error={errorMessage}>
            <input />
          </FormField>
        </TestWrapper>
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    test('does not display error when error prop not provided', () => {
      const { container } = render(
        <TestWrapper>
          <FormField name="testField" label="Test Label">
            <input />
          </FormField>
        </TestWrapper>
      );

      // Look for any element with error text class or role
      const errorElements = container.querySelectorAll('[class*="error"], [role="alert"]');
      expect(errorElements.length).toBe(0);
    });

    test('error message has proper styling class', () => {
      const errorMessage = 'This field is required';
      const { container } = render(
        <TestWrapper>
          <FormField name="testField" label="Test Label" error={errorMessage}>
            <input />
          </FormField>
        </TestWrapper>
      );

      const errorElement = screen.getByText(errorMessage);
      // Check that className contains "error"
      expect(errorElement.className).toMatch(/error/i);
    });
  });

  describe('Accessibility (ARIA)', () => {
    test('sets aria-required on input when required prop is true', () => {
      render(
        <TestWrapper>
          <FormField name="testField" label="Test Label" required>
            <input data-testid="test-input" />
          </FormField>
        </TestWrapper>
      );

      const input = screen.getByTestId('test-input');
      expect(input).toHaveAttribute('aria-required', 'true');
    });

    test('sets aria-describedby on input when error is present', () => {
      const errorMessage = 'This field is required';
      render(
        <TestWrapper>
          <FormField name="testField" label="Test Label" error={errorMessage}>
            <input data-testid="test-input" />
          </FormField>
        </TestWrapper>
      );

      const input = screen.getByTestId('test-input');
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      expect(describedBy).toContain('testField-error');
    });

    test('sets aria-describedby on input when description is present', () => {
      const description = 'This is a helpful description';
      render(
        <TestWrapper>
          <FormField name="testField" label="Test Label" description={description}>
            <input data-testid="test-input" />
          </FormField>
        </TestWrapper>
      );

      const input = screen.getByTestId('test-input');
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      expect(describedBy).toContain('testField-description');
    });

    test('error message has aria-live="polite" for screen reader announcements', () => {
      const errorMessage = 'This field is required';
      render(
        <TestWrapper>
          <FormField name="testField" label="Test Label" error={errorMessage}>
            <input />
          </FormField>
        </TestWrapper>
      );

      const errorElement = screen.getByText(errorMessage);
      expect(errorElement).toHaveAttribute('aria-live', 'polite');
    });

    test('error message has role="alert" for accessibility', () => {
      const errorMessage = 'This field is required';
      render(
        <TestWrapper>
          <FormField name="testField" label="Test Label" error={errorMessage}>
            <input />
          </FormField>
        </TestWrapper>
      );

      const errorElement = screen.getByText(errorMessage);
      expect(errorElement).toHaveAttribute('role', 'alert');
    });
  });

  describe('React Hook Form Integration', () => {
    test('integrates with React Hook Form Controller', () => {
      const { container } = render(
        <TestWrapper defaultValues={{ testField: 'initial value' }}>
          <FormField name="testField" label="Test Label">
            <input data-testid="test-input" />
          </FormField>
        </TestWrapper>
      );

      // FormField should work within React Hook Form context
      expect(container.querySelector('[data-testid="test-input"]')).toBeInTheDocument();
    });
  });

  describe('TypeScript Props', () => {
    test('accepts all required props', () => {
      // This test verifies TypeScript compilation
      // If it compiles and renders, all required props are properly typed
      render(
        <TestWrapper>
          <FormField
            name="testField"
            label="Test Label"
            description="Test description"
            required={true}
            error="Test error"
          >
            <input />
          </FormField>
        </TestWrapper>
      );

      expect(screen.getByText('Test Label')).toBeInTheDocument();
    });
  });
});
