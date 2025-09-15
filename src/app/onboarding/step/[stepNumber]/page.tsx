import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{
    stepNumber: string
  }>
}

export default async function OnboardingStepRootPage({ params }: PageProps) {
  const { stepNumber } = await params
  redirect(`/en/onboarding/step/${stepNumber}`)
}