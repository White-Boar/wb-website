import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CustomSoftwareForm } from '@/components/CustomSoftwareForm'

// Mock fetch
global.fetch = jest.fn()

describe('CustomSoftwareForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders form with all required fields', () => {
    render(<CustomSoftwareForm />)

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/describe what you would like us to build/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    const { container } = render(<CustomSoftwareForm />)

    const form = container.querySelector('form')
    fireEvent.submit(form!)

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    expect(screen.getByText(/phone is required/i)).toBeInTheDocument()
    expect(screen.getByText(/project description is required/i)).toBeInTheDocument()
  })

  it('shows validation error for short name', async () => {
    const { container } = render(<CustomSoftwareForm />)

    const nameInput = screen.getByLabelText(/name/i)
    fireEvent.change(nameInput, { target: { value: 'A' } })

    const form = container.querySelector('form')
    fireEvent.submit(form!)

    await waitFor(() => {
      expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument()
    })
  })

  it('shows validation error for invalid email', async () => {
    const { container } = render(<CustomSoftwareForm />)

    const emailInput = screen.getByLabelText(/email/i)
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })

    const form = container.querySelector('form')
    fireEvent.submit(form!)

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    })
  })

  it('shows validation error for invalid phone', async () => {
    const { container } = render(<CustomSoftwareForm />)

    const phoneInput = screen.getByLabelText(/phone/i)
    fireEvent.change(phoneInput, { target: { value: '123' } })

    const form = container.querySelector('form')
    fireEvent.submit(form!)

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid phone number/i)).toBeInTheDocument()
    })
  })

  it('shows validation error for short description', async () => {
    const { container } = render(<CustomSoftwareForm />)

    const descriptionInput = screen.getByLabelText(/describe what you would like us to build/i)
    fireEvent.change(descriptionInput, { target: { value: 'Too short' } })

    const form = container.querySelector('form')
    fireEvent.submit(form!)

    await waitFor(() => {
      expect(screen.getByText(/please provide more details.*at least 20 characters/i)).toBeInTheDocument()
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
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'John Doe' }
    })
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john@example.com' }
    })
    fireEvent.change(screen.getByLabelText(/phone/i), {
      target: { value: '+39 123 456 7890' }
    })
    fireEvent.change(screen.getByLabelText(/describe what you would like us to build/i), {
      target: { value: 'I need a custom SaaS platform for managing inventory and sales' }
    })

    // Submit form
    const submitButton = screen.getByRole('button', { name: /send/i })
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
      expect(screen.getByText(/thank you/i)).toBeInTheDocument()
      expect(screen.getByText(/we will be in touch within 2 business days/i)).toBeInTheDocument()
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
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'John Doe' }
    })
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john@example.com' }
    })
    fireEvent.change(screen.getByLabelText(/phone/i), {
      target: { value: '+39 123 456 7890' }
    })
    fireEvent.change(screen.getByLabelText(/describe what you would like us to build/i), {
      target: { value: 'I need a custom SaaS platform for managing inventory' }
    })

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => {
      expect(screen.getByText(/server error/i)).toBeInTheDocument()
    })
  })

  it('disables form fields while submitting', async () => {
    const mockFetch = global.fetch as jest.Mock
    mockFetch.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    render(<CustomSoftwareForm />)

    // Fill out form
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'John Doe' }
    })
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john@example.com' }
    })
    fireEvent.change(screen.getByLabelText(/phone/i), {
      target: { value: '+39 123 456 7890' }
    })
    fireEvent.change(screen.getByLabelText(/describe what you would like us to build/i), {
      target: { value: 'I need a custom SaaS platform for managing inventory' }
    })

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /send/i }))

    // Check that button shows loading state
    await waitFor(() => {
      expect(screen.getByText(/sending/i)).toBeInTheDocument()
    })

    // Check that inputs are disabled
    expect(screen.getByLabelText(/name/i)).toBeDisabled()
    expect(screen.getByLabelText(/email/i)).toBeDisabled()
    expect(screen.getByLabelText(/phone/i)).toBeDisabled()
    expect(screen.getByLabelText(/describe what you would like us to build/i)).toBeDisabled()
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
