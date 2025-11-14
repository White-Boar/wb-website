import { render, screen, fireEvent } from '@testing-library/react'
import { Footer } from '@/components/Footer'

// Mock next-intl to return translation keys
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key
}))

// Mock scrollIntoView
const mockScrollIntoView = jest.fn()
window.HTMLElement.prototype.scrollIntoView = mockScrollIntoView

describe('Footer', () => {
  beforeEach(() => {
    mockScrollIntoView.mockClear()
    document.getElementById = jest.fn((id) => ({
      scrollIntoView: mockScrollIntoView
    }))
  })

  it('renders footer content', () => {
    render(<Footer />)

    expect(screen.getByTestId('footer-brand-logo')).toBeInTheDocument()
    expect(screen.getByTestId('footer-brand-description')).toBeInTheDocument()
    expect(screen.getByText('copyright')).toBeInTheDocument()
  })

  it('displays quick links section', () => {
    render(<Footer />)

    expect(screen.getByTestId('footer-quick-links-heading')).toBeInTheDocument()
    expect(screen.getByTestId('footer-link-services')).toBeInTheDocument()
    expect(screen.getByTestId('footer-link-clients')).toBeInTheDocument()
  })

  it('displays legal section with links', () => {
    render(<Footer />)

    expect(screen.getByTestId('footer-legal-heading')).toBeInTheDocument()
    expect(screen.getByTestId('footer-link-terms')).toBeInTheDocument()
    expect(screen.getByTestId('footer-link-privacy')).toBeInTheDocument()
    expect(screen.getByTestId('footer-manage-cookies-button')).toBeInTheDocument()
  })

  it('scrolls to sections when quick links are clicked', () => {
    render(<Footer />)

    const servicesButton = screen.getByTestId('footer-link-services')
    fireEvent.click(servicesButton)

    expect(document.getElementById).toHaveBeenCalledWith('pricing')
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' })
  })

  it('has contact link', () => {
    render(<Footer />)

    const contactLink = screen.getByText('contact')
    expect(contactLink).toHaveAttribute('href', '/contact')
  })

  it('has proper semantic structure', () => {
    render(<Footer />)

    const footer = screen.getByRole('contentinfo')
    expect(footer).toBeInTheDocument()

    const headings = screen.getAllByRole('heading', { level: 3 })
    expect(headings).toHaveLength(2) // Quick Links and Legal
  })

  it('has WhiteBoar logo', () => {
    render(<Footer />)

    const logoWrapper = screen.getByTestId('footer-brand-logo')
    expect(logoWrapper).toBeInTheDocument()
    // Logo is now the WhiteBoarLogo component
    const logo = screen.getByAltText('WhiteBoar Logo')
    expect(logo).toBeInTheDocument()
  })
})
