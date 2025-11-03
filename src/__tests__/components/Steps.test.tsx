import { render, screen } from '@testing-library/react'
import { Steps } from '@/components/Steps'

describe('Steps', () => {
  it('renders the section title', () => {
    render(<Steps />)

    expect(screen.getByText('Three simple steps')).toBeInTheDocument()
    const heading = screen.getByRole('heading', { level: 2, name: 'Three simple steps' })
    expect(heading).toBeInTheDocument()
  })

  it('renders all three steps', () => {
    render(<Steps />)

    expect(screen.getByText('Start now')).toBeInTheDocument()
    expect(screen.getByText('Approve your project')).toBeInTheDocument()
    expect(screen.getByText('Go live & grow')).toBeInTheDocument()
  })

  it('renders step numbers', () => {
    render(<Steps />)

    expect(screen.getByText('01')).toBeInTheDocument()
    expect(screen.getByText('02')).toBeInTheDocument()
    expect(screen.getByText('03')).toBeInTheDocument()
  })

  it('renders step subtitles', () => {
    render(<Steps />)

    expect(screen.getByText('Tell us about your vision')).toBeInTheDocument()
    expect(screen.getByText("In five days, you'll receive a complete website")).toBeInTheDocument()
    expect(screen.getByText('Launch your business online')).toBeInTheDocument()
  })

  it('renders step descriptions', () => {
    render(<Steps />)

    expect(screen.getByText("In just 15 minutes, our smart form captures the essence of your business.")).toBeInTheDocument()
    expect(screen.getByText('Beautiful, branded, and ready to launch in English and Italian.')).toBeInTheDocument()
    expect(screen.getByText('Attract new customers and build lasting loyalty through our platform.')).toBeInTheDocument()
  })

  it('has proper semantic structure', () => {
    render(<Steps />)

    const section = document.querySelector('section')
    expect(section).toBeInTheDocument()

    const headings = screen.getAllByRole('heading', { level: 3 })
    expect(headings).toHaveLength(3)
  })

  it('renders all step icons', () => {
    const { container } = render(<Steps />)

    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThanOrEqual(3)
  })

  it('applies hover effects classes', () => {
    const { container } = render(<Steps />)

    const stepCards = container.querySelectorAll('.group')
    expect(stepCards).toHaveLength(3)

    stepCards.forEach(card => {
      expect(card.querySelector('.group-hover\\:scale-110')).toBeInTheDocument()
    })
  })
})
