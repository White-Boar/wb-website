import { notFound } from 'next/navigation';

const locales = ['en', 'it'];

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}) {
  const { locale } = await params;

  if (locale && !locales.includes(locale)) {
    notFound();
  }

  return (
    <html lang={locale || 'en'} suppressHydrationWarning>
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
                      document.documentElement.className = 'scroll-smooth ' + systemTheme;
                    } else {
                      document.documentElement.className = 'scroll-smooth ' + stored;
                    }
                  } else {
                    document.documentElement.className = 'scroll-smooth light';
                  }
                } catch (e) {
                  document.documentElement.className = 'scroll-smooth light';
                }
              })();
            `,
          }}
        />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}