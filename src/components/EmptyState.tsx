import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  /** Icon shown above title (e.g. lucide-react icon). */
  icon?: ReactNode;
  title: string;
  description?: string;
  /** CTA button or link. */
  action?: ReactNode;
  className?: string;
  /** 'card' = large centered block (pages); 'inline' = compact (dialogs, sidebars). */
  variant?: 'card' | 'inline';
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  variant = 'card',
}: EmptyStateProps) {
  const isCard = variant === 'card';
  return (
    <div
      className={cn(
        'text-center',
        isCard
          ? 'glass-card p-8 sm:p-12 flex flex-col items-center justify-center'
          : 'py-8 px-4 flex flex-col items-center justify-center',
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            'flex items-center justify-center text-muted-foreground mb-4',
            isCard ? 'w-14 h-14 rounded-full bg-muted/50' : 'mb-3'
          )}
        >
          {icon}
        </div>
      )}
      <h3
        className={cn(
          'font-medium text-foreground',
          isCard ? 'text-lg mb-2' : 'text-sm mb-1'
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            'text-muted-foreground',
            isCard ? 'text-sm mb-6 max-w-sm' : 'text-xs mb-4 max-w-xs'
          )}
        >
          {description}
        </p>
      )}
      {action && (isCard ? <div className="mt-2">{action}</div> : <div>{action}</div>)}
    </div>
  );
}
