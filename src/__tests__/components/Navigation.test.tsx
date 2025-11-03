import { render, screen, fireEvent } from '@testing-library/react'
import { Navigation } from '@/components/Navigation'

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

    expect(screen.getByText('WhiteBoar')).toBeInTheDocument()
    expect(screen.getByText('Services')).toBeInTheDocument()
    expect(screen.getByText('Clients')).toBeInTheDocument()
    expect(screen.getByText('Start')).toBeInTheDocument()
  })

  it('has proper logo link', () => {
    render(<Navigation />)
    
    const logoLink = screen.getByRole('link', { name: /whiteboar/i })
    expect(logoLink).toHaveAttribute('href', '/')
  })

  it('scrolls to pricing section when services button is clicked', () => {
    render(<Navigation />)

    const servicesButton = screen.getByText('Services')
    fireEvent.click(servicesButton)

    expect(document.getElementById).toHaveBeenCalledWith('pricing')
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' })
  })

  it('scrolls to portfolio section when clients button is clicked', () => {
    render(<Navigation />)
    
    const clientsButton = screen.getByText('Clients')
    fireEvent.click(clientsButton)
    
    expect(document.getElementById).toHaveBeenCalledWith('portfolio')
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' })
  })

  it('has proper social media links', () => {
    render(<Navigation />)
    
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