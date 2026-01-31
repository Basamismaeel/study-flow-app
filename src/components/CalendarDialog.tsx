import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CalendarEvent } from '@/types';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { safeFormat, safeParseDate } from '@/lib/dateUtils';
import { useUserLocalStorage } from '@/hooks/useUserLocalStorage';

interface CalendarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CalendarDialog({ open, onOpenChange }: CalendarDialogProps) {
  const [events, setEvents] = useUserLocalStorage<CalendarEvent[]>('calendar-events', []);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [eventContent, setEventContent] = useState('');

  // Reset to current month when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentMonth(new Date());
      setSelectedDate(null);
      setEditingEvent(null);
      setEventContent('');
    }
  }, [open]);

  const currentYear = currentMonth.getFullYear();
  const currentMonthIndex = currentMonth.getMonth();

  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonthIndex, 1).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const calendarDays = useMemo(() => {
    try {
      const days: (Date | null)[] = [];
      
      // Add empty cells for days before the first day of the month
      for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(null);
      }
      
      // Add all days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        days.push(new Date(currentYear, currentMonthIndex, day));
      }
      
      return days;
    } catch (error) {
      console.error('Error calculating calendar days:', error);
      return [];
    }
  }, [currentYear, currentMonthIndex, firstDayOfMonth, daysInMonth]);

  const getDateString = (date: Date | null): string | null => {
    if (!date) return null;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const getEventsForDate = (dateString: string | null): CalendarEvent[] => {
    if (!dateString) return [];
    return events.filter(e => e.date === dateString);
  };

  const handleDateClick = (date: Date | null) => {
    if (!date) return;
    const dateString = getDateString(date);
    if (!dateString) return;
    
    setSelectedDate(dateString);
    const existingEvents = getEventsForDate(dateString);
    if (existingEvents.length > 0) {
      // If there are events, show the first one for editing
      setEditingEvent(existingEvents[0]);
      setEventContent(existingEvents[0].content);
    } else {
      // New event
      setEditingEvent(null);
      setEventContent('');
    }
  };

  const handleSaveEvent = () => {
    if (!selectedDate || !eventContent.trim()) return;

    if (editingEvent) {
      // Update existing event
      setEvents(events.map(e => 
        e.id === editingEvent.id
          ? { ...e, content: eventContent.trim(), updatedAt: new Date() }
          : e
      ));
    } else {
      // Create new event
      const newEvent: CalendarEvent = {
        id: crypto.randomUUID(),
        date: selectedDate,
        content: eventContent.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setEvents([...events, newEvent]);
    }

    setEventContent('');
    setEditingEvent(null);
    setSelectedDate(null);
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(events.filter(e => e.id !== eventId));
    if (editingEvent?.id === eventId) {
      setEditingEvent(null);
      setEventContent('');
      setSelectedDate(null);
    }
  };

  const handlePrevMonth = () => {
    try {
      setCurrentMonth(new Date(currentYear, currentMonthIndex - 1, 1));
    } catch (error) {
      console.error('Error navigating to previous month:', error);
      setCurrentMonth(new Date());
    }
  };

  const handleNextMonth = () => {
    try {
      setCurrentMonth(new Date(currentYear, currentMonthIndex + 1, 1));
    } catch (error) {
      console.error('Error navigating to next month:', error);
      setCurrentMonth(new Date());
    }
  };

  const today = new Date();
  const todayString = getDateString(today);

  // Ensure we have valid month index
  const safeMonthIndex = currentMonthIndex >= 0 && currentMonthIndex < 12 ? currentMonthIndex : new Date().getMonth();
  const safeYear = currentYear || new Date().getFullYear();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-4 min-h-[400px]">
        <DialogHeader className="pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              {monthNames[safeMonthIndex]} {safeYear}
            </DialogTitle>
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handlePrevMonth}
                className="h-7 w-7"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleNextMonth}
                className="h-7 w-7"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-0.5 w-full">
            {/* Day headers */}
            {dayNames.map((day, idx) => (
              <div 
                key={`header-${idx}`} 
                className="text-center text-xs font-medium text-muted-foreground py-1.5"
              >
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays && calendarDays.length > 0 ? calendarDays.map((date, index) => {
              const dateString = getDateString(date);
              const dateEvents = dateString ? getEventsForDate(dateString) : [];
              const isToday = dateString === todayString;
              const isSelected = dateString === selectedDate;

              return (
                <button
                  key={index}
                  onClick={() => handleDateClick(date)}
                  className={cn(
                    'aspect-square text-sm rounded-md transition-all',
                    !date && 'cursor-default',
                    date && 'hover:bg-accent/50 cursor-pointer',
                    isToday && !isSelected && 'bg-primary/10 font-semibold',
                    isSelected && 'bg-primary text-primary-foreground font-semibold',
                    !isToday && !isSelected && date && 'text-foreground'
                  )}
                  disabled={!date}
                >
                  {date ? (
                    <div className="flex flex-col items-center justify-center h-full gap-0.5">
                      <span className="text-xs">{date.getDate()}</span>
                      {dateEvents.length > 0 && (
                        <div className="flex gap-0.5">
                          {dateEvents.slice(0, 3).map((_, i) => (
                            <div
                              key={i}
                              className={cn(
                                'w-1 h-1 rounded-full',
                                isSelected ? 'bg-primary-foreground/60' : 'bg-primary'
                              )}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </button>
              );
            }) : (
              // Fallback if calendarDays is empty - show current month
              Array.from({ length: 42 }, (_, i) => {
                const day = i - firstDayOfMonth + 1;
                if (day < 1 || day > daysInMonth) {
                  return (
                    <div key={`empty-${i}`} className="aspect-square" />
                  );
                }
                const date = new Date(safeYear, safeMonthIndex, day);
                const dateString = getDateString(date);
                const dateEvents = dateString ? getEventsForDate(dateString) : [];
                const isToday = dateString === todayString;
                const isSelected = dateString === selectedDate;

                return (
                  <button
                    key={`fallback-${i}`}
                    onClick={() => handleDateClick(date)}
                    className={cn(
                      'aspect-square text-sm rounded-md transition-all',
                      'hover:bg-accent/50 cursor-pointer',
                      isToday && !isSelected && 'bg-primary/10 font-semibold',
                      isSelected && 'bg-primary text-primary-foreground font-semibold',
                      'text-foreground'
                    )}
                  >
                    <div className="flex flex-col items-center justify-center h-full gap-0.5">
                      <span className="text-xs">{day}</span>
                      {dateEvents.length > 0 && (
                        <div className="flex gap-0.5">
                          {dateEvents.slice(0, 3).map((_, idx) => (
                            <div
                              key={idx}
                              className={cn(
                                'w-1 h-1 rounded-full',
                                isSelected ? 'bg-primary-foreground/60' : 'bg-primary'
                              )}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Event Editor */}
          {selectedDate && (
            <div className="border-t pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">
                  {safeFormat(safeParseDate(selectedDate + 'T00:00:00'), 'EEE, MMM d')}
                </h3>
                {editingEvent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteEvent(editingEvent.id)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Textarea
                  placeholder="Add event or note..."
                  value={eventContent}
                  onChange={(e) => setEventContent(e.target.value)}
                  rows={3}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSaveEvent} 
                    disabled={!eventContent.trim()}
                    size="sm"
                    className="text-xs h-7"
                  >
                    {editingEvent ? 'Update' : 'Add'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedDate(null);
                      setEditingEvent(null);
                      setEventContent('');
                    }}
                    className="text-xs h-7"
                  >
                    Cancel
                  </Button>
                </div>
              </div>

              {/* Show all events for this date */}
              {getEventsForDate(selectedDate).length > 1 && (
                <div className="space-y-1.5">
                  {getEventsForDate(selectedDate).map(event => (
                    <div
                      key={event.id}
                      className={cn(
                        'p-2 rounded-md border text-sm',
                        editingEvent?.id === event.id ? 'bg-primary/10 border-primary' : 'bg-accent/30'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs">{event.content}</p>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingEvent(event);
                              setEventContent(event.content);
                            }}
                            className="h-5 px-2 text-xs"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteEvent(event.id)}
                            className="h-5 w-5 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
