import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
  variant?: 'default' | 'success';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({
  value,
  max,
  className,
  variant = 'default',
  showLabel = false,
  size = 'md',
}: ProgressBarProps) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>{value} / {max}</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div className={cn('progress-bar', sizeClasses[size])}>
        <div
          className={cn(
            variant === 'success' ? 'progress-fill-success' : 'progress-fill'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
