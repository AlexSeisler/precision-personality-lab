'use client';

import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';


export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'peer h-5 w-5 shrink-0 rounded-md border border-white/20 bg-transparent ring-offset-background transition-all duration-200 hover:border-[#4A8FFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A8FFF] focus-visible:ring-offset-2 data-[state=checked]:bg-[#4A8FFF] data-[state=checked]:border-[#4A8FFF]',
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className="flex items-center justify-center text-white"
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = 'Checkbox';

export { Checkbox };
