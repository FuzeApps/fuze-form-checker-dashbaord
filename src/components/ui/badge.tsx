import React from 'react';
import { cn } from '@/lib/utils';

export const Badge = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
      className
    )}
  >
    {children}
  </span>
);
