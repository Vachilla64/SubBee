import { motion, AnimatePresence, Variants } from "framer-motion";
import { useEffect, useState } from "react";

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

  // Constants for hex sizing (pointy-topped)
  const R = 45; // Radius
  const W = Math.sqrt(3) * R; // ~77.94
  const H = 2 * R; // 90
  const rowStep = 1.5 * R; // 67.5
  const colStep = W;

  // We want to cover a large areato handle most screens
  // and center it.
  const cols = 20;
  const rows = 20;

  const hexes = [];

  // Calculate center indices to stagger animation from center outwards
  const centerR = rows / 2;
  const centerC = cols / 2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Calculate distance from center for stagger effect
      const dist = Math.sqrt(
        Math.pow(r - centerR, 2) + Math.pow(c - centerC, 2),
      );
      hexes.push({ id: `${r}-${c}`, r, c, dist });
    }
  }

  // Sort hexes by distance so they clear from the center out
  hexes.sort((a, b) => a.dist - b.dist);

  const containerVariants: Variants = {
    show: { opacity: 1 },
    hidden: {
      opacity: 0,
      transition: {
        delay: 0.5, // Fade out immediately as hexes clear
        duration: 1,
      },
    },
  };

  const hexVariants: Variants = {
    show: { opacity: 1, scale: 1.05 }, // 1.05 to ensure overlapping (no gaps)
    hidden: {
      opacity: 0,
      scale: 0,
      transition: { duration: 0.3, ease: "easeIn" },
    },
  };

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {show && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-transparent overflow-hidden pointer-events-none"
          initial="show"
          animate="show"
          exit="hidden"
          variants={containerVariants}
        >
          {/* Hex Grid Background */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ width: cols * W, height: rows * rowStep }}
          >
            <motion.div
              initial="show"
              animate="show"
              exit="hidden"
              variants={{
                show: {},
                hidden: { transition: { staggerChildren: 0.0025 } },
              }}
            >
              {hexes.map(({ id, r, c }) => {
                const x = c * colStep + (r % 2 === 1 ? W / 2 : 0);
                const y = r * rowStep;

                return (
                  <motion.div
                    key={id}
                    variants={hexVariants}
                    className="absolute"
                    style={{
                      width: W,
                      height: H,
                      left: x,
                      top: y,
                      clipPath:
                        "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                      backgroundColor: (r + c) % 3 === 0 ? '#EFE6CE' : '#FCF7EA',
                    }}
                  />
                );
              })}
            </motion.div>
          </div>

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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
