import { Button } from '@/components/ui/button';
import { useActiveStudySession } from '@/contexts/ActiveStudySessionContext';
import { Play, Pause, PlayCircle, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

interface StudySessionBlockProps {
  /** Optional: used only if you want to show subject/task in nav; start is always immediate with no category. */
  subjects?: { id: string; name: string }[];
  tasks?: { id: string; label: string }[];
}

export function StudySessionBlock({ subjects = [], tasks = [] }: StudySessionBlockProps) {
  const { active, elapsedSeconds, isPaused, startSession, pauseSession, continueSession, endSession } = useActiveStudySession();

  const handleStartNow = () => {
    startSession({
      subjectId: null,
      subjectName: null,
      taskId: null,
      taskLabel: null,
    });
  };

  if (active) {
    const label = [active.subjectName, active.taskLabel].filter(Boolean).join(' · ') || 'Study session';
    return (
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{label}</p>
            <p className={cn(
              'text-2xl font-mono tabular-nums tracking-tight',
              isPaused ? 'text-muted-foreground' : 'text-primary'
            )}>
              {formatElapsed(elapsedSeconds)}
              {isPaused && <span className="text-sm font-normal text-muted-foreground ml-2">(paused)</span>}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {isPaused ? (
              <Button onClick={continueSession} size="lg" className="gap-2">
                <PlayCircle className="w-4 h-4" />
                Continue
              </Button>
            ) : (
              <Button onClick={pauseSession} variant="secondary" size="lg" className="gap-2">
                <Pause className="w-4 h-4" />
                Pause
              </Button>
            )}
            <Button onClick={endSession} variant="outline" size="lg" className="gap-2">
              <Square className="w-4 h-4" />
              End session
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-4">
      <Button
        onClick={handleStartNow}
        className="w-full sm:w-auto"
        size="lg"
      >
        <Play className="w-4 h-4 mr-2" />
        Start Study Session
      </Button>
    </div>
  );
}
