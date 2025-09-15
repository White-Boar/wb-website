import { locales } from '@/lib/i18n';
import { notFound } from 'next/navigation';

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}) {
  const { locale } = await params;

  if (locale && !locales.includes(locale as typeof locales[number])) {
    notFound();
  }

  return (
    <html lang={locale || 'en'}>
      <body>
        {children}
      </body>
    </html>
  );
}