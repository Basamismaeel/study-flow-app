import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { LanguageWeek } from '@/types';
import { cn } from '@/lib/utils';

interface LanguageWeekCardProps {
  week: LanguageWeek;
  onUpdateWeek: (weekId: string, updates: Partial<LanguageWeek>) => void;
  onUpdateDay: (weekId: string, dayId: string, updates: Partial<LanguageWeek['days'][0]>) => void;
}

export function LanguageWeekCard({ week, onUpdateWeek, onUpdateDay }: LanguageWeekCardProps) {
  return (
    <div className="glass-card p-4 min-w-[320px] w-[320px] shrink-0 flex flex-col">
      <div className="mb-3">
        <Label className="text-xs text-muted-foreground">Chapter</Label>
        <Input
          value={week.chapterName}
          onChange={(e) => onUpdateWeek(week.id, { chapterName: e.target.value })}
          placeholder={`Chapter ${week.weekNumber}`}
          className="mt-1 font-medium"
        />
      </div>

      <div className="space-y-2 flex-1">
        {week.days.map((day) => (
          <div
            key={day.id}
            className={cn(
              'rounded-lg border p-2 transition-colors',
              day.completed ? 'bg-success/15 border-success/30' : 'bg-muted/30 border-border'
            )}
          >
            <div className="flex items-center gap-2">
              <label className="flex items-center cursor-pointer shrink-0">
                <Checkbox
                  checked={day.completed}
                  onCheckedChange={(c) => onUpdateDay(week.id, day.id, { completed: !!c })}
                />
              </label>
              <span className="text-xs font-medium text-muted-foreground w-16 shrink-0">
                {day.dayName.slice(0, 3)}
              </span>
              {day.type === 'coursebook' ? (
                <Input
                  value={day.sectionName}
                  onChange={(e) => onUpdateDay(week.id, day.id, { sectionName: e.target.value })}
                  placeholder="Section name"
                  className="h-8 text-sm flex-1 min-w-0"
                />
              ) : (
                <span className="text-sm font-medium text-foreground flex-1">Speaking Day</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div
        className={cn(
          'mt-3 pt-3 border-t rounded-lg p-2 transition-colors',
          week.workbookCompleted ? 'bg-success/15 border-success/30' : 'bg-muted/30 border-border'
        )}
      >
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={week.workbookCompleted}
            onCheckedChange={(c) => onUpdateWeek(week.id, { workbookCompleted: !!c })}
          />
          <span className="text-sm font-medium">Workbook completed for this week?</span>
        </label>
      </div>
    </div>
  );
}
