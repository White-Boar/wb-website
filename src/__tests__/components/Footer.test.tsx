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
    expect(screen.getByTestId('footer-link-start')).toBeInTheDocument()
  })

  it('displays the manage cookies entry alongside social links', () => {
    render(<Footer />)

    expect(screen.getByTestId('footer-manage-cookies-button')).toBeInTheDocument()

    const twitterLink = screen.getByLabelText('Twitter')
    const linkedinLink = screen.getByLabelText('LinkedIn')
    const githubLink = screen.getByLabelText('GitHub')

    expect(twitterLink).toBeInTheDocument()
    expect(linkedinLink).toBeInTheDocument()
    expect(githubLink).toBeInTheDocument()
  })

  it('has correct social media links', () => {
    render(<Footer />)
    
    const twitterLink = screen.getByLabelText('Twitter')
    const linkedinLink = screen.getByLabelText('LinkedIn')
    const githubLink = screen.getByLabelText('GitHub')
    
    expect(twitterLink).toHaveAttribute('href', 'https://twitter.com/whiteboar_ai')
    expect(linkedinLink).toHaveAttribute('href', 'https://linkedin.com/company/whiteboar')
    expect(githubLink).toHaveAttribute('href', 'https://github.com/whiteboar')
    
    expect(twitterLink).toHaveAttribute('target', '_blank')
    expect(linkedinLink).toHaveAttribute('target', '_blank')
    expect(githubLink).toHaveAttribute('target', '_blank')
  })

  it('scrolls to sections when quick links are clicked', () => {
    render(<Footer />)

    const servicesButton = screen.getByTestId('footer-link-services')
    fireEvent.click(servicesButton)

    expect(document.getElementById).toHaveBeenCalledWith('pricing')
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' })
  })

  it('has checkout link for start button', () => {
    render(<Footer />)

    const startLink = screen.getByTestId('footer-link-start')
    expect(startLink).toHaveAttribute('href', '/checkout')
  })

  it('has proper semantic structure', () => {
    render(<Footer />)

    const footer = screen.getByRole('contentinfo')
    expect(footer).toBeInTheDocument()

    const headings = screen.getAllByRole('heading', { level: 3 })
    expect(headings).toHaveLength(2) // Quick Links and Cookie Settings
  })

  it('has logo with proper styling', () => {
    render(<Footer />)
    
    const logoWrapper = screen.getByTestId('footer-brand-logo')
    expect(logoWrapper).toBeInTheDocument()
    expect(logoWrapper.querySelector('.bg-accent')).toBeTruthy()
  })
})
