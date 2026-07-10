import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';

export default function BottomSheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-[2px] px-4 pb-4 sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-[440px] rounded-[32px] bg-[#FBF8EF] px-6 pb-8 pt-4 shadow-2xl"
          >
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-[#E5DDCB]" />
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
