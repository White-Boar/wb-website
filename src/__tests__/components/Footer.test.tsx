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

    expect(screen.getByText('WhiteBoar')).toBeInTheDocument()
    expect(screen.getByText('brandDescription')).toBeInTheDocument()
    expect(screen.getByText('copyright')).toBeInTheDocument()
  })

  it('displays quick links section', () => {
    render(<Footer />)

    expect(screen.getByText('quickLinks')).toBeInTheDocument()
    expect(screen.getByText('services')).toBeInTheDocument()
    expect(screen.getByText('clients')).toBeInTheDocument()
    expect(screen.getByText('start')).toBeInTheDocument()
  })

  it('displays the manage cookies entry alongside social links', () => {
    render(<Footer />)

    expect(screen.getByText('manageCookies')).toBeInTheDocument()

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

    const servicesButton = screen.getByText('services')
    fireEvent.click(servicesButton)

    expect(document.getElementById).toHaveBeenCalledWith('pricing')
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' })
  })

  it('has checkout link for start button', () => {
    render(<Footer />)

    const startLink = screen.getByRole('link', { name: 'start' })
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
    
    const logo = screen.getByText('WB')
    expect(logo).toBeInTheDocument()
    expect(logo.parentElement).toHaveClass('bg-accent')
  })
})
