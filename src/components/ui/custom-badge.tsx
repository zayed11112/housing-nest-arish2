import React, { ReactNode } from 'react';
import { Badge as ShadcnBadge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type BadgeColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

interface CustomBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  content?: ReactNode;
  color?: BadgeColor;
  children: ReactNode;
  className?: string;
}

const colorStyles: Record<BadgeColor, string> = {
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  success: 'bg-green-500 text-white',
  warning: 'bg-amber-500 text-white',
  error: 'bg-red-500 text-white',
  info: 'bg-blue-500 text-white'
};

export const Badge = ({ 
  content, 
  color = 'primary', 
  children, 
  className,
  ...props 
}: CustomBadgeProps) => {
  if (content) {
    return (
      <div className="relative inline-block">
        {children}
        <div 
          className={cn(
            "absolute bottom-0 right-0 flex items-center justify-center rounded-full min-w-5 min-h-5 p-0.5",
            colorStyles[color],
            className
          )}
          {...props}
        >
          {content}
        </div>
      </div>
    );
  }

  // If no content provided, use as regular badge
  return (
    <ShadcnBadge 
      className={cn(
        colorStyles[color],
        className
      )}
      {...props}
    >
      {children}
    </ShadcnBadge>
  );
}; 