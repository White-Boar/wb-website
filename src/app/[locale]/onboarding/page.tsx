import { getTranslations } from 'next-intl/server';
import { Welcome } from '@/components/onboarding/Welcome';

export async function generateMetadata() {
  const t = await getTranslations('onboarding.welcome');

  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

export default function OnboardingWelcomePage() {
  return <Welcome />;
}
