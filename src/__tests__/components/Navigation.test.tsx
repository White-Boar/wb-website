import { render, screen, fireEvent } from '@testing-library/react'
import { Navigation } from '@/components/Navigation'

// Mock next-intl to return translation keys
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en'
}))

// Mock scrollIntoView
const mockScrollIntoView = jest.fn()
window.HTMLElement.prototype.scrollIntoView = mockScrollIntoView

describe('Navigation', () => {
  beforeEach(() => {
    mockScrollIntoView.mockClear()
    // Mock getElementById
    document.getElementById = jest.fn((id) => ({
      scrollIntoView: mockScrollIntoView
    }))
  })

  it('renders navigation elements', () => {
    render(<Navigation />)

    expect(screen.getByRole('link', { name: /whiteboar logo/i })).toBeInTheDocument()
    expect(screen.getByText('services')).toBeInTheDocument()
    expect(screen.getByText('clients')).toBeInTheDocument()
    expect(screen.getByText('contact')).toBeInTheDocument()
    expect(screen.getByText('start')).toBeInTheDocument()
  })

  it('has proper logo link', () => {
    render(<Navigation />)
    
    const logoLink = screen.getByRole('link', { name: /whiteboar/i })
    expect(logoLink).toHaveAttribute('href', '/')
  })

  it('scrolls to pricing section when services button is clicked', () => {
    render(<Navigation />)

    const servicesButton = screen.getByText('services')
    fireEvent.click(servicesButton)

    expect(document.getElementById).toHaveBeenCalledWith('pricing')
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' })
  })

  it('scrolls to portfolio section when clients button is clicked', () => {
    render(<Navigation />)

    const clientsButton = screen.getByText('clients')
    fireEvent.click(clientsButton)

    expect(document.getElementById).toHaveBeenCalledWith('portfolio')
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' })
  })

  it('has contact link', () => {
    render(<Navigation />)

    const contactLink = screen.getByTestId('nav-contact-link')
    expect(contactLink).toHaveAttribute('href', '/contact')
    expect(contactLink).toHaveTextContent('contact')
  })

  it('has accessible navigation structure', () => {
    render(<Navigation />)
    
    const nav = screen.getByRole('navigation')
    expect(nav).toBeInTheDocument()
    
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toBeInTheDocument()
    })
  })
})