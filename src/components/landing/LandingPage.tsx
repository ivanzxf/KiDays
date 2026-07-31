'use client';

import LandingHero from '@/components/landing/LandingHero';
import LandingSections from '@/components/landing/LandingSections';

interface LandingPageProps {
  onOpenAuth: () => void;
}

export default function LandingPage({ onOpenAuth }: LandingPageProps) {
  return (
    <div className="min-h-screen">
      <LandingHero onOpenAuth={onOpenAuth} />
      <LandingSections />
    </div>
  );
}
