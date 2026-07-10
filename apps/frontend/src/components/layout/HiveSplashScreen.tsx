import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import HoneycombOverlay from "./HoneycombOverlay";

interface HiveSplashScreenProps {
  isLoading?: boolean;
  onComplete?: () => void;
}

export default function HiveSplashScreen({
  isLoading = false,
  onComplete,
}: HiveSplashScreenProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // When isLoading becomes false, wait a tiny bit to ensure the app underneath is rendered, then hide
    if (!isLoading) {
      const timer = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  return (
    <HoneycombOverlay
      isVisible={show}
      onExited={onComplete}
      isSplash={true}
    >
      {/* Logo overlay with pulsing animation when loading */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        animate={
          isLoading ? { scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] } : {}
        }
        transition={
          isLoading
            ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
            : {}
        }
        exit={{
          opacity: 0,
          scale: 0.5,
          filter: "blur(10px)",
          transition: { duration: 0.5, ease: "anticipate" },
        }}
      >
        <img
          src="/illustrations/subbee-logo.png"
          alt="SubBee"
          className="w-32 h-32 drop-shadow-xl"
        />
        <div className="mt-4 text-2xl font-extrabold text-ink tracking-tight">
          SubBee
        </div>
      </motion.div>
    </HoneycombOverlay>
  );
}
