/**
 * Step Page: Central orchestrator for all 13 onboarding steps
 * Handles form state, validation, navigation, and data persistence
 */

import { redirect } from 'next/navigation';

interface StepPageProps {
  params: Promise<{
    locale: string;
    stepNumber: string;
  }>;
}

export default async function StepPage({ params }: StepPageProps) {
  const { locale, stepNumber } = await params;
  const step = parseInt(stepNumber, 10);

  // Validate stepNumber (1-13)
  if (isNaN(step) || step < 1 || step > 13) {
    redirect(`/${locale}/onboarding?error=invalid_step`);
  }

  // For Sprint 002: Minimal infrastructure implementation
  // Full step components will be implemented in later sprints
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold mb-6">
            Step {step} of 13
          </h1>

          <div className="prose dark:prose-invert">
            <p>Step infrastructure ready. Individual step components will be implemented in future sprints.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
