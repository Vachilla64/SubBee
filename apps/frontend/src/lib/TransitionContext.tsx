import { createContext, useContext, useState, ReactNode } from "react";
import HoneycombOverlay from "../components/layout/HoneycombOverlay";

interface TransitionContextType {
  triggerTransition: (action: () => void | Promise<void>) => void;
}

const TransitionContext = createContext<TransitionContextType | null>(null);

export function useTransition() {
  const ctx = useContext(TransitionContext);
  if (!ctx) throw new Error("useTransition must be used within a TransitionProvider");
  return ctx;
}

export function TransitionProvider({ children }: { children: ReactNode }) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void | Promise<void>) | null>(null);

  const triggerTransition = (action: () => void | Promise<void>) => {
    setPendingAction(() => action);
    setIsTransitioning(true);
  };

  const handleCovered = async () => {
    if (pendingAction) {
      await pendingAction();
      setPendingAction(null);
    }
    // After action is done, give it a tiny delay to ensure render, then start animating out
    setTimeout(() => {
      setIsTransitioning(false);
    }, 100);
  };

  return (
    <TransitionContext.Provider value={{ triggerTransition }}>
      {children}
      <HoneycombOverlay 
        isVisible={isTransitioning} 
        onCovered={handleCovered} 
        isSplash={false}
      />
    </TransitionContext.Provider>
  );
}
