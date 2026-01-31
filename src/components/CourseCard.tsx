import { Subject, CourseDailyCompletion } from '@/types';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ChevronRight, ListTodo } from 'lucide-react';

interface CourseCardProps {
  course: Subject;
  todayCompleted: number;
  todayTotal: number;
  onClick?: () => void;
}

export function CourseCard({ course, todayCompleted, todayTotal, onClick }: CourseCardProps) {
  const percent = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;
  const hasTasks = todayTotal > 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        'group rounded-xl border border-border bg-card p-4 transition-all',
        onClick && 'cursor-pointer hover:border-primary/30 hover:bg-accent/30 hover:shadow-sm'
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-2xl">
          {course.icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground truncate">{course.name}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <ListTodo className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {hasTasks ? (
                <>
                  <span className="font-medium text-foreground">{todayCompleted}/{todayTotal}</span>
                  {' '}done today
                </>
              ) : (
                'Add daily tasks'
              )}
            </span>
          </div>
        </div>
        {hasTasks && (
          <div className="shrink-0 w-16">
            <Progress value={percent} className="h-1.5" />
          </div>
        )}
        {onClick && (
          <ChevronRight className="w-5 h-5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
        )}
      </div>
    </div>
  );
}
