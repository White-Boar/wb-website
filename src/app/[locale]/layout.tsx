import '@/app/globals.css';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { ThemeProvider } from '@/components/theme-provider';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: LayoutProps<'/[locale]'>)  {
  // Ensure that the incoming `locale` is valid
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  const messages = await getMessages({ locale });

  return (
    <html lang={locale} className="scroll-smooth light">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('wb-ui-theme');
                  if (stored && ['light', 'dark', 'system'].includes(stored)) {
                    if (stored === 'system') {
                      var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                      if (systemTheme === 'dark') {
                        document.documentElement.classList.replace('light', 'dark');
                      }
                    } else if (stored === 'dark') {
                      document.documentElement.classList.replace('light', 'dark');
                    }
                  }
                } catch (e) {
                  // Keep default 'light' class
                }
              })();
            `,
          }}
        />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider>
          <NextIntlClientProvider messages={messages} locale={locale}>
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}