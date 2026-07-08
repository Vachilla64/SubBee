import type { ReactNode } from 'react';

export default function OnboardingShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-cream-bg">
      <div className="app-shell-width mx-auto flex min-h-screen flex-col px-6 py-8">{children}</div>
    </div>
  );
}
