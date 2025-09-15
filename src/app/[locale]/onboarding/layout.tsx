import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

interface OnboardingLayoutProps {
  children: React.ReactNode
  params: Promise<{
    locale: string
  }>
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'onboarding.meta' })

  return {
    title: t('title'),
    description: t('description'),
    robots: {
      index: false, // Don't index onboarding pages
      follow: false
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      type: 'website',
      siteName: 'WhiteBoar',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    }
  }
}

export default async function OnboardingLayout({
  children,
  params
}: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <OnboardingHeader />

      {/* Main Content */}
      <main className="relative z-10">
        {children}
      </main>

      {/* Footer */}
      <OnboardingFooter />
    </div>
  )
}

// Onboarding Header Component
function OnboardingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm">
            WB
          </div>
          <div>
            <span className="font-bold text-lg">WhiteBoar</span>
            <span className="text-muted-foreground ml-2 text-sm hidden sm:inline">
              Fast & Simple Onboarding
            </span>
          </div>
        </div>
        
        {/* Help/Support Link */}
        <div className="flex items-center gap-2">
          <a
            href="mailto:support@whiteboar.it"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Need help?
          </a>
        </div>
      </div>
    </header>
  )
}

// Onboarding Footer Component
function OnboardingFooter() {
  return (
    <footer className="border-t bg-background/50 backdrop-blur-sm mt-auto">
      <div className="container px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>© 2025 WhiteBoar</span>
            <a 
              href="/privacy" 
              className="hover:text-foreground transition-colors"
              target="_blank"
            >
              Privacy Policy
            </a>
            <a 
              href="/terms" 
              className="hover:text-foreground transition-colors"
              target="_blank"
            >
              Terms of Service
            </a>
          </div>
          
          <div className="flex items-center gap-2">
            <span>Secure & SSL Protected</span>
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
          </div>
        </div>
      </div>
    </footer>
  )
}