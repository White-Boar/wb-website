import { locales } from '@/lib/i18n';
import { notFound } from 'next/navigation';

export default function RootLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale?: string };
}) {
  if (locale && !locales.includes(locale as any)) {
    notFound();
  }

  return children;
}