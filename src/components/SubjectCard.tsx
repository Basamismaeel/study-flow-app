import { Subject, StudySession } from '@/types';
import { subjectMomentum, type Momentum } from '@/lib/sessionUtils';
import { ProgressBar } from './ProgressBar';
import { cn } from '@/lib/utils';
import { TrendingUp, Minus, TrendingDown } from 'lucide-react';

interface SubjectCardProps {
  subject: Subject;
  compact?: boolean;
  onClick?: () => void;
  sessions?: StudySession[];
}

const momentumConfig: Record<Momentum, { label: string; className: string; icon: typeof TrendingUp }> = {
  positive: { label: 'Consistent', className: 'text-success', icon: TrendingUp },
  neutral: { label: 'Some activity', className: 'text-muted-foreground', icon: Minus },
  negative: { label: 'Neglected', className: 'text-warning', icon: TrendingDown },
};

export function SubjectCard({ subject, compact = false, onClick, sessions = [] }: SubjectCardProps) {
  const momentum = subjectMomentum(sessions, subject.id, subject.name);
  const momentumInfo = momentumConfig[momentum];
  const withTotal = subject.tracking.filter((t) => t.total > 0);
  const percents = withTotal.map(
    (t) => Math.round((t.completed / t.total) * 100)
  );
  const overallPercent =
    percents.length > 0
      ? Math.round(percents.reduce((a, p) => a + p, 0) / percents.length)
      : 0;

  const statusColors = {
    'not-started': 'bg-muted text-muted-foreground',
    'in-progress': 'bg-warning/10 text-warning',
    completed: 'bg-success/10 text-success',
  };

  const statusLabels = {
    'not-started': 'Not Started',
    'in-progress': 'In Progress',
    completed: 'Completed',
  };

  if (compact) {
    return (
      <div
        className={cn(
          'subject-card',
          onClick && 'cursor-pointer hover:scale-[1.02]'
        )}
        onClick={onClick}
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">{subject.icon}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground truncate">
              {subject.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {overallPercent}% complete
            </p>
          </div>
        </div>
        <ProgressBar
          value={overallPercent}
          max={100}
          variant={subject.status === 'completed' ? 'success' : 'default'}
          size="sm"
        />
      </div>
    );
  }

  return (
    <div className="subject-card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{subject.icon}</span>
          <div>
            <h3 className="font-semibold text-lg text-foreground">
              {subject.name}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span
                className={cn(
                  'inline-block px-2 py-0.5 rounded-full text-xs font-medium',
                  statusColors[subject.status]
                )}
              >
                {statusLabels[subject.status]}
              </span>
              {sessions.length > 0 && (() => {
                const Icon = momentumInfo.icon;
                return (
                  <span className={cn('inline-flex items-center gap-1 text-xs', momentumInfo.className)}>
                    <Icon className="w-3 h-3" />
                    {momentumInfo.label}
                  </span>
                );
              })()}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-foreground">
            {overallPercent}%
          </p>
          <p className="text-xs text-muted-foreground">Overall</p>
        </div>
      </div>

      <div className="space-y-4">
        {subject.tracking
          .filter((t) => t.total > 0)
          .map((t) => (
            <div key={t.id}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">{t.label}</span>
                <span className="font-medium text-foreground">
                  {t.completed} / {t.total}
                </span>
              </div>
              <ProgressBar
                value={t.completed}
                max={t.total}
                size="sm"
              />
            </div>
          ))}
        {subject.tracking.filter((t) => t.total > 0).length === 0 && (
          <p className="text-sm text-muted-foreground">No tracking items yet</p>
        )}
      </div>
    </div>
  );
}
