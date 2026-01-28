import { useTimer } from '@/contexts/TimerContext';
import { Button } from '@/components/ui/button';
import { X, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TimerNotification() {
  const { isComplete, dismissNotification } = useTimer();

  if (!isComplete) return null;

  return (
    <div className={cn(
      'fixed top-20 left-1/2 -translate-x-1/2 z-50',
      'bg-destructive text-destructive-foreground',
      'px-6 py-4 rounded-xl shadow-2xl',
      'flex items-center gap-4',
      'animate-fade-in'
    )}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-destructive-foreground/20 rounded-full animate-pulse">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <p className="font-semibold">Timer Complete!</p>
          <p className="text-sm opacity-90">Your focus session has ended</p>
        </div>
      </div>
      <Button
        size="icon"
        variant="ghost"
        onClick={dismissNotification}
        className="hover:bg-destructive-foreground/20 text-destructive-foreground"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
