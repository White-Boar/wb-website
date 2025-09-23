import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ThemeProvider } from '@/components/theme-provider'
import { OnboardingHeader } from './components/OnboardingHeader'

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
    <ThemeProvider defaultTheme="system" storageKey="wb-ui-theme">
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
    </ThemeProvider>
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
          </div>

          <div className="flex items-center gap-2 sm:ml-auto">
            <span>Secure & SSL Protected</span>
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
          </div>
        </div>
      </div>
    </footer>
  )
}