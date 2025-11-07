import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CustomSoftwareForm } from '@/components/CustomSoftwareForm'

// Mock next-intl to return translation keys
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key
}))

// Mock fetch
global.fetch = jest.fn()

describe('CustomSoftwareForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders form with all required fields', () => {
    render(<CustomSoftwareForm />)

    // Using regex to match labels in a locale-agnostic way
    expect(screen.getByLabelText(/customSoftware\.form\.nameLabel/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/customSoftware\.form\.emailLabel/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/customSoftware\.form\.phoneLabel/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/customSoftware\.form\.descriptionLabel/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /customSoftware\.form\.submitButton/i })).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    const { container } = render(<CustomSoftwareForm />)

    const form = container.querySelector('form')
    fireEvent.submit(form!)

    await waitFor(() => {
      expect(screen.getByText('errors.nameRequired')).toBeInTheDocument()
    })
    expect(screen.getByText('errors.emailRequired')).toBeInTheDocument()
    expect(screen.getByText('errors.phoneRequired')).toBeInTheDocument()
    expect(screen.getByText('errors.descriptionRequired')).toBeInTheDocument()
  })

  it('shows validation error for short name', async () => {
    const { container } = render(<CustomSoftwareForm />)

    const nameInput = screen.getByLabelText(/customSoftware\.form\.nameLabel/i)
    fireEvent.change(nameInput, { target: { value: 'A' } })

    const form = container.querySelector('form')
    fireEvent.submit(form!)

    await waitFor(() => {
      expect(screen.getByText('errors.nameTooShort')).toBeInTheDocument()
    })
  })

  it('shows validation error for invalid email', async () => {
    const { container } = render(<CustomSoftwareForm />)

    const emailInput = screen.getByLabelText(/customSoftware\.form\.emailLabel/i)
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })

    const form = container.querySelector('form')
    fireEvent.submit(form!)

    await waitFor(() => {
      expect(screen.getByText('errors.emailInvalid')).toBeInTheDocument()
    })
  })

  it('shows validation error for invalid phone', async () => {
    const { container } = render(<CustomSoftwareForm />)

    const phoneInput = screen.getByLabelText(/customSoftware\.form\.phoneLabel/i)
    fireEvent.change(phoneInput, { target: { value: '123' } })

    const form = container.querySelector('form')
    fireEvent.submit(form!)

    await waitFor(() => {
      expect(screen.getByText('errors.phoneInvalid')).toBeInTheDocument()
    })
  })

  it('shows validation error for short description', async () => {
    const { container } = render(<CustomSoftwareForm />)

    const descriptionInput = screen.getByLabelText(/customSoftware\.form\.descriptionLabel/i)
    fireEvent.change(descriptionInput, { target: { value: 'Too short' } })

    const form = container.querySelector('form')
    fireEvent.submit(form!)

    await waitFor(() => {
      expect(screen.getByText('errors.descriptionTooShort')).toBeInTheDocument()
    })
  })

  it('submits form successfully with valid data', async () => {
    const mockFetch = global.fetch as jest.Mock
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    })

    render(<CustomSoftwareForm />)

    // Fill out form
    fireEvent.change(screen.getByLabelText(/customSoftware\.form\.nameLabel/i), {
      target: { value: 'John Doe' }
    })
    fireEvent.change(screen.getByLabelText(/customSoftware\.form\.emailLabel/i), {
      target: { value: 'john@example.com' }
    })
    fireEvent.change(screen.getByLabelText(/customSoftware\.form\.phoneLabel/i), {
      target: { value: '+39 123 456 7890' }
    })
    fireEvent.change(screen.getByLabelText(/customSoftware\.form\.descriptionLabel/i), {
      target: { value: 'I need a custom SaaS platform for managing inventory and sales' }
    })

    // Submit form
    const submitButton = screen.getByRole('button', { name: /customSoftware\.form\.submitButton/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/custom-software/contact',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('John Doe')
        })
      )
    })

    // Check success message
    await waitFor(() => {
      expect(screen.getByText('success.title')).toBeInTheDocument()
      expect(screen.getByText('success.message')).toBeInTheDocument()
    })
  })

  it('shows error message when submission fails', async () => {
    const mockFetch = global.fetch as jest.Mock
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: 'Server error' })
    })

    render(<CustomSoftwareForm />)

    // Fill out form with valid data
    fireEvent.change(screen.getByLabelText(/customSoftware\.form\.nameLabel/i), {
      target: { value: 'John Doe' }
    })
    fireEvent.change(screen.getByLabelText(/customSoftware\.form\.emailLabel/i), {
      target: { value: 'john@example.com' }
    })
    fireEvent.change(screen.getByLabelText(/customSoftware\.form\.phoneLabel/i), {
      target: { value: '+39 123 456 7890' }
    })
    fireEvent.change(screen.getByLabelText(/customSoftware\.form\.descriptionLabel/i), {
      target: { value: 'I need a custom SaaS platform for managing inventory' }
    })

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /customSoftware\.form\.submitButton/i }))

    await waitFor(() => {
      expect(screen.getByText(/server error/i)).toBeInTheDocument()
    })
  })

  it('disables form fields while submitting', async () => {
    const mockFetch = global.fetch as jest.Mock
    mockFetch.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    render(<CustomSoftwareForm />)

    // Fill out form
    fireEvent.change(screen.getByLabelText(/customSoftware\.form\.nameLabel/i), {
      target: { value: 'John Doe' }
    })
    fireEvent.change(screen.getByLabelText(/customSoftware\.form\.emailLabel/i), {
      target: { value: 'john@example.com' }
    })
    fireEvent.change(screen.getByLabelText(/customSoftware\.form\.phoneLabel/i), {
      target: { value: '+39 123 456 7890' }
    })
    fireEvent.change(screen.getByLabelText(/customSoftware\.form\.descriptionLabel/i), {
      target: { value: 'I need a custom SaaS platform for managing inventory' }
    })

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /customSoftware\.form\.submitButton/i }))

    // Check that button shows loading state
    await waitFor(() => {
      expect(screen.getByText('submitting')).toBeInTheDocument()
    })

    // Check that inputs are disabled
    expect(screen.getByLabelText(/customSoftware\.form\.nameLabel/i)).toBeDisabled()
    expect(screen.getByLabelText(/customSoftware\.form\.emailLabel/i)).toBeDisabled()
    expect(screen.getByLabelText(/customSoftware\.form\.phoneLabel/i)).toBeDisabled()
    expect(screen.getByLabelText(/customSoftware\.form\.descriptionLabel/i)).toBeDisabled()
  })

  it('has proper accessibility attributes', () => {
    render(<CustomSoftwareForm />)

    const nameInput = screen.getByLabelText(/name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const phoneInput = screen.getByLabelText(/phone/i)
    const descriptionInput = screen.getByLabelText(/describe what you would like us to build/i)

    expect(nameInput).toHaveAttribute('required')
    expect(emailInput).toHaveAttribute('required')
    expect(phoneInput).toHaveAttribute('required')
    expect(descriptionInput).toHaveAttribute('required')

    expect(nameInput).toHaveAttribute('type', 'text')
    expect(emailInput).toHaveAttribute('type', 'email')
    expect(phoneInput).toHaveAttribute('type', 'tel')
  })

  it('clears field error when user starts typing', async () => {
    const { container } = render(<CustomSoftwareForm />)

    // Submit empty form to get errors
    const form = container.querySelector('form')
    fireEvent.submit(form!)

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument()
    })

    // Start typing in name field
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'John' }
    })

    // Error should be cleared
    expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument()
  })
})
