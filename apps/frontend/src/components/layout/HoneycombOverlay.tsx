import { motion, AnimatePresence, Variants } from "framer-motion";
import { useMemo, ReactNode } from "react";

interface HoneycombOverlayProps {
  isVisible: boolean;
  onCovered?: () => void;
  onExited?: () => void;
  isSplash?: boolean;
  children?: ReactNode;
}

export default function HoneycombOverlay({
  isVisible,
  onCovered,
  onExited,
  isSplash = false,
  children
}: HoneycombOverlayProps) {
  // Constants for hex sizing (pointy-topped)
  const R = 45; // Radius
  const W = Math.sqrt(3) * R; // ~77.94
  const H = 2 * R; // 90
  const rowStep = 1.5 * R; // 67.5
  const colStep = W;

  // We want to cover a large area to handle most screens
  const cols = 20;
  const rows = 20;

  const hexes = useMemo(() => {
    const arr = [];
    const centerR = rows / 2;
    const centerC = cols / 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const dist = Math.sqrt(Math.pow(r - centerR, 2) + Math.pow(c - centerC, 2));
        arr.push({ id: `${r}-${c}`, r, c, dist });
      }
    }
    arr.sort((a, b) => a.dist - b.dist);
    return arr;
  }, []);

  const containerVariants: Variants = {
    show: { opacity: 1 },
    hidden: {
      opacity: 0,
      transition: {
        when: "afterChildren",
        delay: 0.1, // Slight delay after hexes finish
        duration: 0.2,
      },
    },
  };

  const gridVariants: Variants = {
    show: {
      transition: { staggerChildren: 0.003 }
    },
    hidden: {
      transition: { staggerChildren: 0.003, staggerDirection: -1 } // Outside-in on exit
    }
  };

  const hexVariants: Variants = {
    show: { opacity: 1, scale: 1.05 }, // 1.05 to ensure overlapping (no gaps)
    hidden: {
      opacity: 0,
      scale: 0,
      transition: { duration: 0.25, ease: "easeIn" },
    },
  };

  return (
    <AnimatePresence 
      onExitComplete={() => {
        if (onExited) onExited();
      }}
    >
      {isVisible && (
        <motion.div
          key="honeycomb-overlay"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-transparent overflow-hidden pointer-events-auto"
          initial={isSplash ? "show" : "hidden"}
          animate="show"
          exit="hidden"
          variants={containerVariants}
          onAnimationComplete={(definition) => {
            if (definition === "show" && onCovered) {
              onCovered();
            }
          }}
        >
          {/* Hex Grid Background */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ width: cols * W, height: rows * rowStep }}
            variants={gridVariants}
            initial={isSplash ? "show" : "hidden"}
            animate="show"
            exit="hidden"
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
                    clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                    backgroundColor: (r + c) % 3 === 0 ? '#EFE6CE' : '#FCF7EA',
                  }}
                />
              );
            })}
          </motion.div>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
