import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

const PRESET_TIMES = [
  { label: '25 min', minutes: 25 },
  { label: '45 min', minutes: 45 },
  { label: '60 min', minutes: 60 },
];

export function TimerPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isTimerMode, setIsTimerMode] = useState(false);

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      // Play notification sound or show alert
      if (Notification.permission === 'granted') {
        new Notification('Timer Complete!', {
          body: 'Your focus session has ended.',
        });
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatClock = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleStart = useCallback(() => {
    if (!isTimerMode) {
      setTimeLeft(timerMinutes * 60);
      setIsTimerMode(true);
    }
    setIsRunning(true);
    
    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [isTimerMode, timerMinutes]);

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsTimerMode(false);
    setTimeLeft(timerMinutes * 60);
  };

  const adjustMinutes = (delta: number) => {
    const newMinutes = Math.max(1, Math.min(120, timerMinutes + delta));
    setTimerMinutes(newMinutes);
    if (!isTimerMode) {
      setTimeLeft(newMinutes * 60);
    }
  };

  const selectPreset = (minutes: number) => {
    setTimerMinutes(minutes);
    if (!isTimerMode) {
      setTimeLeft(minutes * 60);
    }
  };

  const progress = isTimerMode ? ((timerMinutes * 60 - timeLeft) / (timerMinutes * 60)) * 100 : 0;

  return (
    <div className="max-w-xl mx-auto space-y-12 animate-fade-in">
      {/* Live Clock */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">Current Time</p>
        <p className="clock-display">{formatClock(currentTime)}</p>
        <p className="text-sm text-muted-foreground mt-2">
          {currentTime.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Timer Section */}
      <div className="glass-card p-8">
        <div className="text-center mb-8">
          <h2 className="text-lg font-medium text-foreground mb-6">Focus Timer</h2>
          
          {/* Timer Display with Progress Ring */}
          <div className="relative inline-flex items-center justify-center mb-8">
            <svg className="w-56 h-56 -rotate-90">
              <circle
                cx="112"
                cy="112"
                r="100"
                className="fill-none stroke-muted"
                strokeWidth="8"
              />
              <circle
                cx="112"
                cy="112"
                r="100"
                className="fill-none stroke-primary transition-all duration-1000 ease-linear"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 100}
                strokeDashoffset={2 * Math.PI * 100 * (1 - progress / 100)}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn(
                'timer-display',
                timeLeft === 0 && 'text-success'
              )}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          {/* Time Adjustment (only when not running) */}
          {!isTimerMode && (
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustMinutes(-5)}
                  disabled={timerMinutes <= 5}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-lg font-medium text-foreground w-24">
                  {timerMinutes} min
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustMinutes(5)}
                  disabled={timerMinutes >= 120}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Presets */}
              <div className="flex justify-center gap-2">
                {PRESET_TIMES.map((preset) => (
                  <Button
                    key={preset.minutes}
                    variant={timerMinutes === preset.minutes ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => selectPreset(preset.minutes)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex justify-center gap-4">
            {!isRunning ? (
              <Button size="lg" onClick={handleStart} className="px-8">
                <Play className="w-5 h-5 mr-2" />
                {isTimerMode ? 'Resume' : 'Start'}
              </Button>
            ) : (
              <Button size="lg" variant="outline" onClick={handlePause} className="px-8">
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </Button>
            )}
            {isTimerMode && (
              <Button size="lg" variant="ghost" onClick={handleReset}>
                <RotateCcw className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Status Message */}
        {isRunning && (
          <p className="text-center text-sm text-muted-foreground animate-pulse">
            Stay focused. You've got this! 💪
          </p>
        )}
        {timeLeft === 0 && (
          <p className="text-center text-sm text-success font-medium">
            Session complete! Great work! 🎉
          </p>
        )}
      </div>

      {/* Tips */}
      <div className="text-center text-sm text-muted-foreground">
        <p>💡 Pro tip: Use 25-minute sessions for focused studying</p>
      </div>
    </div>
  );
}
