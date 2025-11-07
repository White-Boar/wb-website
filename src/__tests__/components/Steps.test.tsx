import { render, screen } from '@testing-library/react'
import { Steps } from '@/components/Steps'

// Mock next-intl to return translation keys
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key
}))

describe('Steps', () => {
  it('renders the section title', () => {
    render(<Steps />)

    expect(screen.getByText('title')).toBeInTheDocument()
    const heading = screen.getByRole('heading', { level: 2, name: 'title' })
    expect(heading).toBeInTheDocument()
  })

  it('renders all three steps', () => {
    render(<Steps />)

    expect(screen.getByText('step1.title')).toBeInTheDocument()
    expect(screen.getByText('step2.title')).toBeInTheDocument()
    expect(screen.getByText('step3.title')).toBeInTheDocument()
  })

  it('renders step numbers', () => {
    render(<Steps />)

    expect(screen.getByText('01')).toBeInTheDocument()
    expect(screen.getByText('02')).toBeInTheDocument()
    expect(screen.getByText('03')).toBeInTheDocument()
  })

  it('renders step subtitles', () => {
    render(<Steps />)

    expect(screen.getByText('step1.subtitle')).toBeInTheDocument()
    expect(screen.getByText('step2.subtitle')).toBeInTheDocument()
    expect(screen.getByText('step3.subtitle')).toBeInTheDocument()
  })

  it('renders step descriptions', () => {
    render(<Steps />)

    expect(screen.getByText('step1.description')).toBeInTheDocument()
    expect(screen.getByText('step2.description')).toBeInTheDocument()
    expect(screen.getByText('step3.description')).toBeInTheDocument()
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
