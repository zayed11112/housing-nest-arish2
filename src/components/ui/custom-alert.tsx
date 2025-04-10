import React from 'react';
import { Alert as ShadcnAlert, AlertDescription } from '@/components/ui/alert';
import { X, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type AlertSeverity = 'info' | 'success' | 'warning' | 'error';

interface CustomAlertProps extends React.HTMLAttributes<HTMLDivElement> {
  severity?: AlertSeverity;
  onClose?: () => void;
  children: React.ReactNode;
}

const severityStyles: Record<AlertSeverity, string> = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  success: 'bg-green-50 border-green-200 text-green-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  error: 'bg-red-50 border-red-200 text-red-800'
};

const severityIcons: Record<AlertSeverity, React.ReactNode> = {
  info: <Info className="h-5 w-5 text-blue-600" />,
  success: <CheckCircle className="h-5 w-5 text-green-600" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-600" />,
  error: <AlertCircle className="h-5 w-5 text-red-600" />
};

export const Alert = ({ 
  severity = 'info',
  children,
  className,
  onClose,
  ...props
}: CustomAlertProps) => {
  return (
    <ShadcnAlert 
      className={cn(
        'relative pr-10', 
        severityStyles[severity], 
        className
      )} 
      {...props}
    >
      <div className="absolute left-4 top-4">
        {severityIcons[severity]}
      </div>
      <AlertDescription className="pl-7">
        {children}
      </AlertDescription>
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-6 w-6 rounded-full p-0"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      )}
    </ShadcnAlert>
  );
}; 