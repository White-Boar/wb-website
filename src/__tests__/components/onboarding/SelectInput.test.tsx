/**
 * Unit tests for SelectInput component
 * Tests dropdown select with Radix UI and React Hook Form integration
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { SelectInput } from '@/components/onboarding/form-fields/SelectInput';

// Test wrapper with React Hook Form context
function TestWrapper({ children, defaultValues = {} }: { children: React.ReactNode; defaultValues?: any }) {
  const methods = useForm({ defaultValues });
  return <FormProvider {...methods}>{children}</FormProvider>;
}

const testOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

describe('SelectInput Component', () => {
  describe('Basic Rendering', () => {
    test('renders select input with label', () => {
      render(
        <TestWrapper>
          <SelectInput name="testField" label="Test Label" options={testOptions} />
        </TestWrapper>
      );

      expect(screen.getByText('Test Label')).toBeInTheDocument();
    });

    test('displays placeholder when no value selected', () => {
      const placeholder = 'Select an option';
      render(
        <TestWrapper>
          <SelectInput
            name="testField"
            label="Test Label"
            options={testOptions}
            placeholder={placeholder}
          />
        </TestWrapper>
      );

      expect(screen.getByText(placeholder)).toBeInTheDocument();
    });

    test('displays selected value in trigger button', () => {
      render(
        <TestWrapper defaultValues={{ testField: 'option2' }}>
          <SelectInput name="testField" label="Test Label" options={testOptions} />
        </TestWrapper>
      );

      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    test.skip('renders all options when dropdown opened', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <SelectInput name="testField" label="Test Label" options={testOptions} />
        </TestWrapper>
      );

      // Click trigger to open dropdown
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      // Wait for options to appear
      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeVisible();
        expect(screen.getByText('Option 2')).toBeVisible();
        expect(screen.getByText('Option 3')).toBeVisible();
      });
    });
  });

  describe('Dropdown Interaction', () => {
    test.skip('opens dropdown on click', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <SelectInput
            name="testField"
            label="Test Label"
            options={testOptions}
            placeholder="Select"
          />
        </TestWrapper>
      );

      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      await user.click(trigger);

      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    test.skip('closes dropdown after selection', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <SelectInput name="testField" label="Test Label" options={testOptions} />
        </TestWrapper>
      );

      // Open dropdown
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      // Select an option
      await waitFor(() => {
        const option = screen.getByText('Option 2');
        user.click(option);
      });

      // Dropdown should close
      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
      });
    });
  });

  describe('Keyboard Navigation', () => {
    test.skip('opens dropdown with Enter key', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <SelectInput name="testField" label="Test Label" options={testOptions} />
        </TestWrapper>
      );

      const trigger = screen.getByRole('combobox');

      // Tab to focus
      await user.tab();
      expect(trigger).toHaveFocus();

      // Press Enter
      await user.keyboard('{Enter}');

      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    test.skip('closes dropdown with Escape key', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <SelectInput name="testField" label="Test Label" options={testOptions} />
        </TestWrapper>
      );

      const trigger = screen.getByRole('combobox');

      // Open dropdown
      await user.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');

      // Press Escape
      await user.keyboard('{Escape}');

      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    test.skip('navigates options with arrow keys', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <SelectInput name="testField" label="Test Label" options={testOptions} />
        </TestWrapper>
      );

      // Open dropdown
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      // Arrow down should navigate through options
      await user.keyboard('{ArrowDown}');
      // Note: Radix UI Select handles focus internally
      // We verify by checking if options are still visible
      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeVisible();
      });
    });

    test.skip('selects option with Enter key', async () => {
      const user = userEvent.setup();
      const TestForm = () => {
        const methods = useForm({ defaultValues: { testField: '' } });
        return (
          <FormProvider {...methods}>
            <SelectInput name="testField" label="Test Label" options={testOptions} />
            <div data-testid="value">{methods.watch('testField')}</div>
          </FormProvider>
        );
      };

      render(<TestForm />);

      // Open dropdown
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      // Navigate and select
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      // Value should be selected
      await waitFor(() => {
        const value = screen.getByTestId('value').textContent;
        expect(value).toBeTruthy();
      });
    });
  });

  describe('React Hook Form Integration', () => {
    test('integrates with React Hook Form', () => {
      render(
        <TestWrapper defaultValues={{ testField: 'option2' }}>
          <SelectInput name="testField" label="Test Label" options={testOptions} />
        </TestWrapper>
      );

      // Selected value should be displayed
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    test.skip('updates form value on selection', async () => {
      const user = userEvent.setup();
      const TestForm = () => {
        const methods = useForm({ defaultValues: { testField: '' } });
        return (
          <FormProvider {...methods}>
            <SelectInput name="testField" label="Test Label" options={testOptions} />
            <div data-testid="value">{methods.watch('testField')}</div>
          </FormProvider>
        );
      };

      render(<TestForm />);

      // Open dropdown and select
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(async () => {
        const option = screen.getByText('Option 2');
        await user.click(option);
      });

      // Value should update
      await waitFor(() => {
        expect(screen.getByTestId('value')).toHaveTextContent('option2');
      });
    });
  });

  describe('Accessibility (ARIA)', () => {
    test('trigger has role combobox', () => {
      render(
        <TestWrapper>
          <SelectInput name="testField" label="Test Label" options={testOptions} />
        </TestWrapper>
      );

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    test('trigger has aria-expanded attribute', () => {
      render(
        <TestWrapper>
          <SelectInput name="testField" label="Test Label" options={testOptions} />
        </TestWrapper>
      );

      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveAttribute('aria-expanded');
    });

    test.skip('aria-expanded toggles on open/close', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <SelectInput name="testField" label="Test Label" options={testOptions} />
        </TestWrapper>
      );

      const trigger = screen.getByRole('combobox');

      // Initially closed
      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      // Open
      await user.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');

      // Close
      await user.keyboard('{Escape}');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('FormField Integration', () => {
    test('displays error message when error prop provided', () => {
      const errorMessage = 'This field is required';
      render(
        <TestWrapper>
          <SelectInput name="testField" label="Test Label" options={testOptions} error={errorMessage} />
        </TestWrapper>
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    test('displays required indicator when required prop is true', () => {
      render(
        <TestWrapper>
          <SelectInput name="testField" label="Test Label" options={testOptions} required />
        </TestWrapper>
      );

      const label = screen.getByText(/Test Label/);
      expect(label.textContent).toContain('*');
    });

    test('displays description when provided', () => {
      const description = 'This is a helpful description';
      render(
        <TestWrapper>
          <SelectInput
            name="testField"
            label="Test Label"
            options={testOptions}
            description={description}
          />
        </TestWrapper>
      );

      expect(screen.getByText(description)).toBeInTheDocument();
    });
  });
});
