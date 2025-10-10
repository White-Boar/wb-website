import { getTranslations } from 'next-intl/server';
import { ThankYou } from '@/components/onboarding/ThankYou';

export async function generateMetadata() {
  const t = await getTranslations('onboarding.thankYou');

  return {
    title: t('title'),
    description: t('message'),
  };
}

export default function OnboardingThankYouPage() {
  return <ThankYou />;
}
