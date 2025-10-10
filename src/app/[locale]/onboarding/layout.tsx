import { ReactNode } from 'react';

export const metadata = {
  title: 'Get Your Website | WhiteBoar',
  description: 'Start your journey to a professional website in just a few simple steps.',
};

interface OnboardingLayoutProps {
  children: ReactNode;
}

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--wb-background)]">
      {children}
    </div>
  );
}
