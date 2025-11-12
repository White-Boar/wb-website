import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ThemeProvider } from '@/components/theme-provider'
import { Navigation } from '@/components/Navigation'
import { ContactForm } from '@/components/ContactForm'
import { Footer } from '@/components/Footer'

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact.meta' })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://whiteboar.it'
  const canonicalUrl = locale === 'en' ? `${baseUrl}/contact` : `${baseUrl}/${locale}/contact`
  const ogImage = `/images/og-image-${locale}.png`

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: canonicalUrl,
      siteName: 'WhiteBoar',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: t('title'),
        },
      ],
      locale: locale,
      alternateLocale: locale === 'en' ? 'it' : 'en',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: [ogImage],
    },
    alternates: {
      canonical: locale === 'en' ? '/contact' : `/${locale}/contact`,
      languages: {
        'en': '/contact',
        'it': '/it/contact',
      },
    },
  }
}

export default async function ContactPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'contact' })

  return (
    <ThemeProvider defaultTheme="system" storageKey="wb-ui-theme">
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1">
          {/* Hero Section */}
          <section className="py-16 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  {t('title')}
                </h1>
              </div>
            </div>
          </section>

          {/* Contact Form Section */}
          <section className="py-16 bg-background">
            <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
              <ContactForm />
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  )
}
