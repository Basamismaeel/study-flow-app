import { MedicalSystem } from '@/types';
import { ProgressBar } from './ProgressBar';
import { cn } from '@/lib/utils';

interface SystemCardProps {
  system: MedicalSystem;
  compact?: boolean;
  onClick?: () => void;
}

export function SystemCard({ system, compact = false, onClick }: SystemCardProps) {
  const bootcampPercent = system.bootcamp.total > 0 
    ? Math.round((system.bootcamp.completed / system.bootcamp.total) * 100) 
    : 0;
  const qbankPercent = system.qbank.total > 0 
    ? Math.round((system.qbank.completed / system.qbank.total) * 100) 
    : 0;
  
  // Calculate overall percent: average of enabled fields only
  const enabledFields = [
    system.bootcamp.total > 0 ? bootcampPercent : null,
    system.qbank.total > 0 ? qbankPercent : null
  ].filter((p): p is number => p !== null);
  const overallPercent = enabledFields.length > 0 
    ? Math.round(enabledFields.reduce((acc, p) => acc + p, 0) / enabledFields.length)
    : 0;

  const statusColors = {
    'not-started': 'bg-muted text-muted-foreground',
    'in-progress': 'bg-warning/10 text-warning',
    'completed': 'bg-success/10 text-success',
  };

  const statusLabels = {
    'not-started': 'Not Started',
    'in-progress': 'In Progress',
    'completed': 'Completed',
  };

  if (compact) {
    return (
      <div 
        className={cn(
          'system-card cursor-pointer hover:scale-[1.02]',
          onClick && 'cursor-pointer'
        )}
        onClick={onClick}
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">{system.icon}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground truncate">{system.name}</h3>
            <p className="text-xs text-muted-foreground">{overallPercent}% complete</p>
          </div>
        </div>
        <ProgressBar 
          value={overallPercent} 
          max={100} 
          variant={system.status === 'completed' ? 'success' : 'default'}
          size="sm"
        />
      </div>
    );
  }

  return (
    <div className="system-card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{system.icon}</span>
          <div>
            <h3 className="font-semibold text-lg text-foreground">{system.name}</h3>
            <span className={cn(
              'inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1',
              statusColors[system.status]
            )}>
              {statusLabels[system.status]}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-foreground">{overallPercent}%</p>
          <p className="text-xs text-muted-foreground">Overall</p>
        </div>
      </div>

      <div className="space-y-4">
        {system.bootcamp.total > 0 && (
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-muted-foreground">Bootcamp Videos</span>
              <span className="font-medium text-foreground">
                {system.bootcamp.completed} / {system.bootcamp.total}
              </span>
            </div>
            <ProgressBar 
              value={system.bootcamp.completed} 
              max={system.bootcamp.total}
              size="sm"
            />
          </div>
        )}

        {system.qbank.total > 0 && (
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-muted-foreground">QBank Questions</span>
              <span className="font-medium text-foreground">
                {system.qbank.completed} / {system.qbank.total}
              </span>
            </div>
            <ProgressBar 
              value={system.qbank.completed} 
              max={system.qbank.total}
              size="sm"
            />
          </div>
        )}
      </div>
    </div>
  );
}
