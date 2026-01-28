import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimer } from '@/contexts/TimerContext';

export function TimerPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  
  const { 
    timeLeft, 
    isRunning, 
    isComplete, 
    progress, 
    startTimer, 
    pauseTimer, 
    resumeTimer, 
    resetTimer 
  } = useTimer();

  const isTimerMode = timeLeft > 0 || isRunning || isComplete;

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatClock = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleStart = () => {
    if (isTimerMode && !isRunning && !isComplete) {
      resumeTimer();
    } else {
      startTimer(hours, minutes, seconds);
    }
  };

  const handlePause = () => {
    pauseTimer();
  };

  const handleReset = () => {
    resetTimer();
  };

  const handleInputChange = (field: 'hours' | 'minutes' | 'seconds', value: string) => {
    const num = Math.max(0, parseInt(value) || 0);
    switch (field) {
      case 'hours':
        setHours(Math.min(23, num));
        break;
      case 'minutes':
        setMinutes(Math.min(59, num));
        break;
      case 'seconds':
        setSeconds(Math.min(59, num));
        break;
    }
  };

  const selectPreset = (h: number, m: number, s: number) => {
    setHours(h);
    setMinutes(m);
    setSeconds(s);
  };

  const PRESETS = [
    { label: '25 min', h: 0, m: 25, s: 0 },
    { label: '45 min', h: 0, m: 45, s: 0 },
    { label: '1 hour', h: 1, m: 0, s: 0 },
    { label: '2 hours', h: 2, m: 0, s: 0 },
  ];

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
                className={cn(
                  "fill-none transition-all duration-1000 ease-linear",
                  isComplete ? "stroke-destructive" : "stroke-primary"
                )}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 100}
                strokeDashoffset={2 * Math.PI * 100 * (1 - progress / 100)}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn(
                'timer-display',
                isComplete && 'text-destructive'
              )}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          {/* Time Adjustment (only when not running) */}
          {!isTimerMode && (
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-center gap-2">
                <div className="text-center">
                  <label className="text-xs text-muted-foreground block mb-1">Hours</label>
                  <Input
                    type="number"
                    value={hours}
                    onChange={(e) => handleInputChange('hours', e.target.value)}
                    className="w-20 text-center text-lg font-medium"
                    min={0}
                    max={23}
                  />
                </div>
                <span className="text-2xl text-muted-foreground mt-5">:</span>
                <div className="text-center">
                  <label className="text-xs text-muted-foreground block mb-1">Minutes</label>
                  <Input
                    type="number"
                    value={minutes}
                    onChange={(e) => handleInputChange('minutes', e.target.value)}
                    className="w-20 text-center text-lg font-medium"
                    min={0}
                    max={59}
                  />
                </div>
                <span className="text-2xl text-muted-foreground mt-5">:</span>
                <div className="text-center">
                  <label className="text-xs text-muted-foreground block mb-1">Seconds</label>
                  <Input
                    type="number"
                    value={seconds}
                    onChange={(e) => handleInputChange('seconds', e.target.value)}
                    className="w-20 text-center text-lg font-medium"
                    min={0}
                    max={59}
                  />
                </div>
              </div>

              {/* Presets */}
              <div className="flex flex-wrap justify-center gap-2">
                {PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    variant={hours === preset.h && minutes === preset.m && seconds === preset.s ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => selectPreset(preset.h, preset.m, preset.s)}
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
              <Button 
                size="lg" 
                onClick={handleStart} 
                className="px-8"
                disabled={!isTimerMode && hours === 0 && minutes === 0 && seconds === 0}
              >
                <Play className="w-5 h-5 mr-2" />
                {isTimerMode && !isComplete ? 'Resume' : 'Start'}
              </Button>
            ) : (
              <Button size="lg" variant="outline" onClick={handlePause} className="px-8">
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </Button>
            )}
            {(isTimerMode || isComplete) && (
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
        {isComplete && (
          <p className="text-center text-sm text-destructive font-medium">
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
