import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  headerRight?: ReactNode;
};

export default function OnboardingShell({ children, headerRight }: Props) {
  return (
    <div className="min-h-screen bg-cream-bg">
      <div className="app-shell-width mx-auto flex min-h-screen flex-col px-6 py-8">
        {headerRight && (
          <div className="mb-4 flex justify-end">
            {headerRight}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
