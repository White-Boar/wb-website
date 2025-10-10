export default function OnboardingLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--wb-primary)] mx-auto mb-4"></div>
        <p className="text-[var(--wb-neutral-600)]">Loading...</p>
      </div>
    </div>
  );
}
