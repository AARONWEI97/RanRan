import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  variant?: 'fade' | 'slide' | 'scale' | 'flip';
}

const variants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slide: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  flip: {
    initial: { opacity: 0, rotateY: -15 },
    animate: { opacity: 1, rotateY: 0 },
    exit: { opacity: 0, rotateY: 15 },
  },
};

function PageTransition({ children, variant = 'slide' }: PageTransitionProps) {
  const variantConfig = variants[variant];

  return (
    <motion.div
      initial={variantConfig.initial}
      animate={variantConfig.animate}
      exit={variantConfig.exit}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
}

export default PageTransition;
