import { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  options: string[];
  label?: string;
  /** 'sm' for compact (e.g. edit dialogs), 'md' for add dialogs */
  size?: 'sm' | 'md';
}

export function IconPicker({
  value,
  onChange,
  options,
  label = 'Icon',
  size = 'md',
}: IconPickerProps) {
  const [open, setOpen] = useState(false);

  const buttonClass = size === 'sm'
    ? 'w-8 h-8 text-base rounded-md'
    : 'w-9 h-9 text-lg rounded-lg';
  const selectedBoxClass = size === 'sm'
    ? 'w-9 h-9 text-lg rounded-lg'
    : 'w-10 h-10 text-xl rounded-lg';

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="space-y-2">
      <CollapsibleTrigger asChild>
        <div
          className="flex items-center gap-2 cursor-pointer rounded-md hover:bg-muted/50 transition-colors py-1 -mx-1 px-1 w-fit"
          role="button"
          aria-expanded={open}
          aria-label={open ? 'Hide icons' : 'Show icons'}
        >
          <Label className="text-sm font-medium shrink-0 pointer-events-none">{label}</Label>
          <div
            className={cn(
              'flex items-center justify-center rounded-lg border-2 border-border bg-muted/30 shrink-0',
              selectedBoxClass
            )}
          >
            {value}
          </div>
          <ChevronDown
            className={cn('h-4 w-4 text-muted-foreground transition-transform shrink-0', open && 'rotate-180')}
          />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="max-h-[200px] overflow-y-auto rounded-lg border border-border bg-muted/10 p-2">
          <div className="flex flex-wrap gap-2">
            {options.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onChange(emoji);
                }}
                className={cn(
                  'rounded-lg border-2 transition-all',
                  buttonClass,
                  value === emoji
                    ? 'border-primary bg-primary/10 scale-105'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
