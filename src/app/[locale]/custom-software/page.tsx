import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ThemeProvider } from '@/components/theme-provider'
import { Navigation } from '@/components/Navigation'
import { CustomSoftwareHero } from '@/components/CustomSoftwareHero'
import { CustomSoftwareForm } from '@/components/CustomSoftwareForm'
import { PortfolioCarousel } from '@/components/PortfolioCarousel'
import { Footer } from '@/components/Footer'

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'customSoftware.meta' })

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      type: 'website',
      locale: locale,
      alternateLocale: locale === 'en' ? 'it' : 'en',
    },
    alternates: {
      canonical: locale === 'en' ? '/en/custom-software' : `/${locale}/custom-software`,
      languages: {
        'en': '/en/custom-software',
        'it': '/it/custom-software',
      },
    },
  }
}

export default async function CustomSoftwarePage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <ThemeProvider defaultTheme="system" storageKey="wb-ui-theme">
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1">
          <CustomSoftwareHero />

          <section className="py-16 bg-background">
            <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
              <CustomSoftwareForm />
            </div>
          </section>

          <PortfolioCarousel />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  )
}
