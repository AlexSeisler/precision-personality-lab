import { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'glass' | 'solid' | 'bordered';
  hoverable?: boolean;
  children: React.ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'glass', hoverable = false, children, className = '', ...props }, ref) => {
    const baseClasses = 'rounded-xl transition-all duration-200';

    const variantClasses = {
      glass: 'glass-card',
      solid: 'bg-slate-800 border border-slate-700',
      bordered: 'bg-transparent border border-white/10',
    };

    const hoverClasses = hoverable
      ? 'hover:shadow-2xl hover:shadow-[#4A8FFF]/10 cursor-pointer'
      : '';

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={hoverable ? { scale: 1.02, y: -4 } : {}}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className={`${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';
