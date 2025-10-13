/**
 * Unit tests for TextInput component
 * Tests text/password input with React Hook Form integration
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { TextInput } from '@/components/onboarding/form-fields/TextInput';

// Test wrapper with React Hook Form context
function TestWrapper({ children, defaultValues = {} }: { children: React.ReactNode; defaultValues?: any }) {
  const methods = useForm({ defaultValues });
  return <FormProvider {...methods}>{children}</FormProvider>;
}

describe('TextInput Component', () => {
  describe('Basic Rendering', () => {
    test('renders text input with label', () => {
      render(
        <TestWrapper>
          <TextInput name="testField" label="Test Label" />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
      expect(screen.getByLabelText('Test Label')).toHaveAttribute('type', 'text');
    });

    test('renders password input when type is password', () => {
      render(
        <TestWrapper>
          <TextInput name="passwordField" label="Password" type="password" />
        </TestWrapper>
      );

      const input = screen.getByLabelText('Password');
      expect(input).toHaveAttribute('type', 'password');
    });

    test('displays placeholder text when provided', () => {
      const placeholder = 'Enter your name';
      render(
        <TestWrapper>
          <TextInput name="testField" label="Test Label" placeholder={placeholder} />
        </TestWrapper>
      );

      expect(screen.getByPlaceholderText(placeholder)).toBeInTheDocument();
    });

    test('does not display placeholder when not provided', () => {
      const { container } = render(
        <TestWrapper>
          <TextInput name="testField" label="Test Label" />
        </TestWrapper>
      );

      const input = container.querySelector('input');
      expect(input?.placeholder).toBe('');
    });
  });

  describe('MaxLength and Character Counter', () => {
    test('applies maxLength attribute when provided', () => {
      render(
        <TestWrapper>
          <TextInput name="testField" label="Test Label" maxLength={100} />
        </TestWrapper>
      );

      const input = screen.getByLabelText('Test Label');
      expect(input).toHaveAttribute('maxLength', '100');
    });

    test('displays character counter when maxLength provided', () => {
      render(
        <TestWrapper defaultValues={{ testField: 'Hello' }}>
          <TextInput name="testField" label="Test Label" maxLength={100} />
        </TestWrapper>
      );

      // Look for character counter format "X / Y characters"
      expect(screen.getByText(/\d+ \/ \d+ characters/)).toBeInTheDocument();
    });

    test('character counter shows correct count', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper defaultValues={{ testField: '' }}>
          <TextInput name="testField" label="Test Label" maxLength={50} />
        </TestWrapper>
      );

      const input = screen.getByLabelText('Test Label');

      // Initially "0 / 50 characters"
      expect(screen.getByText('0 / 50 characters')).toBeInTheDocument();

      // Type text
      await user.type(input, 'Hello');

      // Should update to "5 / 50 characters"
      expect(screen.getByText('5 / 50 characters')).toBeInTheDocument();
    });

    test('does not display character counter when maxLength not provided', () => {
      const { container } = render(
        <TestWrapper>
          <TextInput name="testField" label="Test Label" />
        </TestWrapper>
      );

      // Look for any text containing "characters"
      const counterElement = container.querySelector('[class*="counter"]');
      expect(counterElement).not.toBeInTheDocument();
    });
  });

  describe('AutoComplete Attribute', () => {
    test('applies autoComplete attribute when provided', () => {
      render(
        <TestWrapper>
          <TextInput name="email" label="Email" autoComplete="email" />
        </TestWrapper>
      );

      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('autoComplete', 'email');
    });

    test('supports various autoComplete values', () => {
      const { rerender } = render(
        <TestWrapper>
          <TextInput name="name" label="Name" autoComplete="name" />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Name')).toHaveAttribute('autoComplete', 'name');

      rerender(
        <TestWrapper>
          <TextInput name="phone" label="Phone" autoComplete="tel" />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Phone')).toHaveAttribute('autoComplete', 'tel');
    });
  });

  describe('React Hook Form Integration', () => {
    test('integrates with React Hook Form', () => {
      render(
        <TestWrapper defaultValues={{ testField: 'initial value' }}>
          <TextInput name="testField" label="Test Label" />
        </TestWrapper>
      );

      const input = screen.getByLabelText('Test Label') as HTMLInputElement;
      expect(input.value).toBe('initial value');
    });

    test('updates form value on input change', async () => {
      const user = userEvent.setup();
      const TestForm = () => {
        const methods = useForm({ defaultValues: { testField: '' } });
        return (
          <FormProvider {...methods}>
            <TextInput name="testField" label="Test Label" />
            <div data-testid="value">{methods.watch('testField')}</div>
          </FormProvider>
        );
      };

      render(<TestForm />);

      const input = screen.getByLabelText('Test Label');
      await user.type(input, 'New value');

      expect(screen.getByTestId('value')).toHaveTextContent('New value');
    });
  });

  describe('Styling and Design Tokens', () => {
    test('input has proper styling classes', () => {
      const { container } = render(
        <TestWrapper>
          <TextInput name="testField" label="Test Label" />
        </TestWrapper>
      );

      const input = container.querySelector('input');
      expect(input?.className).toBeTruthy();
    });

    test('focus state is keyboard accessible', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <TextInput name="testField" label="Test Label" />
        </TestWrapper>
      );

      const input = screen.getByLabelText('Test Label');

      // Tab to focus the input
      await user.tab();

      expect(input).toHaveFocus();
    });
  });

  describe('FormField Integration', () => {
    test('displays error message when error prop provided', () => {
      const errorMessage = 'This field is required';
      render(
        <TestWrapper>
          <TextInput name="testField" label="Test Label" error={errorMessage} />
        </TestWrapper>
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    test('displays required indicator when required prop is true', () => {
      render(
        <TestWrapper>
          <TextInput name="testField" label="Test Label" required />
        </TestWrapper>
      );

      const label = screen.getByText(/Test Label/);
      expect(label.textContent).toContain('*');
    });

    test('displays description when provided', () => {
      const description = 'This is a helpful description';
      render(
        <TestWrapper>
          <TextInput name="testField" label="Test Label" description={description} />
        </TestWrapper>
      );

      expect(screen.getByText(description)).toBeInTheDocument();
    });
  });
});
