import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Play, Pause, RotateCcw, Timer, Coffee } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimer } from '@/contexts/TimerContext';
import { useUserLocalStorage } from '@/hooks/useUserLocalStorage';

type TimeUnit = 'minutes' | 'hours';
type TimerMode = 'focus' | 'pomodoro';
type PomodoroPhase = 'work' | 'shortBreak' | 'longBreak';

const DEFAULT_TIMER_MINUTES = 25;
const POMODORO_WORK_DEFAULT = 25;
const POMODORO_SHORT_DEFAULT = 5;
const POMODORO_LONG_DEFAULT = 15;
const POMODORO_SESSIONS_BEFORE_LONG = 4;

export function TimerPage() {
  const [defaultMinutes, setDefaultMinutes] = useUserLocalStorage<number>(
    'timer-default-minutes',
    DEFAULT_TIMER_MINUTES
  );
  const [pomodoroWork, setPomodoroWork] = useUserLocalStorage<number>(
    'pomodoro-work-minutes',
    POMODORO_WORK_DEFAULT
  );
  const [pomodoroShort, setPomodoroShort] = useUserLocalStorage<number>(
    'pomodoro-short-minutes',
    POMODORO_SHORT_DEFAULT
  );
  const [pomodoroLong, setPomodoroLong] = useUserLocalStorage<number>(
    'pomodoro-long-minutes',
    POMODORO_LONG_DEFAULT
  );

  const [currentTime, setCurrentTime] = useState(new Date());
  const [mode, setMode] = useState<TimerMode>('focus');
  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>('work');
  const [pomodoroSession, setPomodoroSession] = useState(0); // 0..3, work sessions before long break
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [quickValue, setQuickValue] = useState('');
  const [quickUnit, setQuickUnit] = useState<TimeUnit>('minutes');
  const prevCompleteRef = useRef(false);
  const prevModeRef = useRef<TimerMode | null>(null);

  const { 
    timeLeft, 
    isRunning, 
    isComplete, 
    progress, 
    canSetDuration, 
    startTimer, 
    pauseTimer, 
    resumeTimer, 
    resetTimer 
  } = useTimer();

  // Initialize duration from default when switching to focus mode or on first load
  useEffect(() => {
    if (mode === 'focus' && prevModeRef.current !== 'focus') {
      const totalMins = Math.min(99 * 60 + 59, Math.max(0, defaultMinutes));
      setHours(Math.floor(totalMins / 60));
      setMinutes(totalMins % 60);
      setSeconds(0);
    }
    prevModeRef.current = mode;
  }, [mode, defaultMinutes]);

  // Pomodoro auto-advance when a phase completes
  useEffect(() => {
    if (mode !== 'pomodoro' || !isComplete) {
      prevCompleteRef.current = isComplete;
      return;
    }
    if (prevCompleteRef.current) return;
    prevCompleteRef.current = true;

    if (pomodoroPhase === 'work') {
      const nextPhase = pomodoroSession === POMODORO_SESSIONS_BEFORE_LONG - 1 ? 'longBreak' : 'shortBreak';
      setPomodoroPhase(nextPhase);
      if (nextPhase === 'longBreak') setPomodoroSession(0);
      const mins = nextPhase === 'longBreak' ? pomodoroLong : pomodoroShort;
      startTimer(0, mins, 0);
    } else {
      setPomodoroPhase('work');
      setPomodoroSession((s) => (pomodoroPhase === 'longBreak' ? 0 : s + 1));
      startTimer(0, pomodoroWork, 0);
    }
  }, [mode, isComplete, pomodoroPhase, pomodoroSession, pomodoroWork, pomodoroShort, pomodoroLong, startTimer]);

  useEffect(() => {
    if (!isComplete) prevCompleteRef.current = false;
  }, [isComplete]);

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

  const isPaused = isTimerMode && !isRunning && !isComplete;
  const isFinished = timeLeft === 0 && !isRunning;
  const showSetDuration = canSetDuration || isComplete || isFinished;
  const showFocusDurationControls = showSetDuration && mode === 'focus';
  const showPomodoroStart = showSetDuration && mode === 'pomodoro';

  const handleStart = () => {
    if (mode === 'pomodoro') {
      setPomodoroPhase('work');
      setPomodoroSession(0);
      startTimer(0, pomodoroWork, 0);
    } else {
      startTimer(hours, minutes, seconds);
    }
  };

  const handlePause = () => {
    pauseTimer();
  };

  const handleResume = () => {
    resumeTimer();
  };

  const handleReset = () => {
    resetTimer();
    if (mode === 'pomodoro') {
      setPomodoroPhase('work');
      setPomodoroSession(0);
    }
  };

  const saveAsDefault = () => {
    const totalMins = hours * 60 + minutes;
    setDefaultMinutes(Math.min(99 * 60 + 59, Math.max(0, totalMins)));
  };

  const handleInputChange = (field: 'hours' | 'minutes' | 'seconds', value: string) => {
    if (value === '') {
      return; // Allow blank while typing
    }
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      switch (field) {
        case 'hours':
          setHours(Math.min(99, Math.max(0, num)));
          break;
        case 'minutes':
          setMinutes(Math.min(59, Math.max(0, num)));
          break;
        case 'seconds':
          setSeconds(Math.min(59, Math.max(0, num)));
          break;
      }
    }
  };

  const handleInputBlur = (field: 'hours' | 'minutes' | 'seconds', e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || isNaN(parseInt(val, 10))) {
      // Reset to current value if blank or invalid
      switch (field) {
        case 'hours':
          e.target.value = hours.toString();
          break;
        case 'minutes':
          e.target.value = minutes.toString();
          break;
        case 'seconds':
          e.target.value = seconds.toString();
          break;
      }
    } else {
      const num = parseInt(val, 10);
      switch (field) {
        case 'hours':
          const h = Math.min(99, Math.max(0, num));
          setHours(h);
          e.target.value = h.toString();
          break;
        case 'minutes':
          const m = Math.min(59, Math.max(0, num));
          setMinutes(m);
          e.target.value = m.toString();
          break;
        case 'seconds':
          const s = Math.min(59, Math.max(0, num));
          setSeconds(s);
          e.target.value = s.toString();
          break;
      }
    }
  };

  const applyQuickSet = () => {
    const num = Math.max(0, parseInt(quickValue, 10) || 0);
    if (quickUnit === 'minutes') {
      const h = Math.floor(num / 60);
      const m = num % 60;
      setHours(Math.min(99, h));
      setMinutes(m);
      setSeconds(0);
    } else {
      setHours(Math.min(99, num));
      setMinutes(0);
      setSeconds(0);
    }
  };

  // When user can set duration, show their selected time in the circle; otherwise show countdown
  const displaySeconds =
    showSetDuration
      ? mode === 'pomodoro'
        ? (pomodoroPhase === 'work' ? pomodoroWork : pomodoroPhase === 'shortBreak' ? pomodoroShort : pomodoroLong) * 60
        : hours * 3600 + minutes * 60 + seconds
      : timeLeft;
  const displayProgress = showSetDuration ? 0 : progress;

  const handleQuickValueKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') applyQuickSet();
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

  const pomodoroPhaseLabel =
    pomodoroPhase === 'work'
      ? 'Focus'
      : pomodoroPhase === 'shortBreak'
        ? 'Short break'
        : 'Long break';
  const pomodoroSessionLabel =
    pomodoroPhase === 'work'
      ? `Session ${pomodoroSession + 1} of ${POMODORO_SESSIONS_BEFORE_LONG}`
      : pomodoroPhase === 'longBreak'
        ? 'Long break'
        : `Break before session ${pomodoroSession + 2}`;

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
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="inline-flex rounded-lg border border-input bg-muted/30 p-1">
              <button
                type="button"
                onClick={() => { setMode('focus'); resetTimer(); }}
                className={cn(
                  'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                  mode === 'focus'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Timer className="w-4 h-4" />
                Focus
              </button>
              <button
                type="button"
                onClick={() => { setMode('pomodoro'); resetTimer(); setPomodoroPhase('work'); setPomodoroSession(0); }}
                className={cn(
                  'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                  mode === 'pomodoro'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Coffee className="w-4 h-4" />
                Pomodoro
              </button>
            </div>
          </div>
          {mode === 'pomodoro' && (
            <p className="text-sm text-muted-foreground mb-2">
              {pomodoroPhaseLabel}
              {isRunning || isPaused || isComplete ? ` · ${pomodoroSessionLabel}` : ''}
            </p>
          )}
          <h2 className="text-lg font-medium text-foreground mb-6">
            {mode === 'pomodoro' ? 'Pomodoro' : 'Focus Timer'}
          </h2>
          
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
                strokeDashoffset={2 * Math.PI * 100 * (1 - displayProgress / 100)}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn(
                'timer-display',
                isComplete && 'text-destructive'
              )}>
                {formatTime(displaySeconds)}
              </span>
            </div>
          </div>

          {/* Pomodoro idle: show settings and Start */}
          {showPomodoroStart && (
            <div className="space-y-4 mb-6">
              <p className="text-xs text-muted-foreground">
                Work {pomodoroWork} min · Short break {pomodoroShort} min · Long break {pomodoroLong} min
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <div className="flex flex-col items-center gap-1">
                  <Label className="text-xs text-muted-foreground">Work</Label>
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    value={pomodoroWork}
                    onChange={(e) => setPomodoroWork(Math.min(60, Math.max(1, parseInt(e.target.value, 10) || 25)))}
                    className="w-14 text-center text-sm"
                    aria-label="Work minutes"
                  />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Label className="text-xs text-muted-foreground">Short</Label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={pomodoroShort}
                    onChange={(e) => setPomodoroShort(Math.min(30, Math.max(1, parseInt(e.target.value, 10) || 5)))}
                    className="w-14 text-center text-sm"
                    aria-label="Short break minutes"
                  />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Label className="text-xs text-muted-foreground">Long</Label>
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    value={pomodoroLong}
                    onChange={(e) => setPomodoroLong(Math.min(60, Math.max(1, parseInt(e.target.value, 10) || 15)))}
                    className="w-14 text-center text-sm"
                    aria-label="Long break minutes"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Time Adjustment (Focus mode: when user can set duration) */}
          {showFocusDurationControls && (
            <div className="space-y-4 mb-6">
              {/* Quick set: amount + minutes or hours */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 p-3 rounded-lg bg-muted/50">
                <Label className="text-xs text-muted-foreground shrink-0">Set duration</Label>
                <Input
                  type="number"
                  placeholder={quickUnit === 'minutes' ? 'e.g. 25' : 'e.g. 2'}
                  value={quickValue}
                  onChange={(e) => {
                    const val = e.target.value;
                    setQuickValue(val);
                  }}
                  onBlur={(e) => {
                    const val = e.target.value;
                    if (val === '' || isNaN(parseInt(val, 10))) {
                      setQuickValue('');
                      e.target.value = '';
                    }
                  }}
                  onKeyDown={handleQuickValueKeyDown}
                  className="w-24 text-center font-medium"
                  min={0}
                />
                <div className="flex rounded-md border border-input overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setQuickUnit('minutes');
                      if (quickValue) {
                        const num = Math.max(0, parseInt(quickValue) || 0);
                        setHours(Math.min(99, Math.floor(num / 60)));
                        setMinutes(num % 60);
                        setSeconds(0);
                      }
                    }}
                    className={cn(
                      'px-3 py-2 text-sm font-medium transition-colors',
                      quickUnit === 'minutes'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background text-muted-foreground hover:bg-muted'
                    )}
                  >
                    Minutes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickUnit('hours');
                      if (quickValue) {
                        const num = Math.max(0, parseInt(quickValue) || 0);
                        setHours(Math.min(99, num));
                        setMinutes(0);
                        setSeconds(0);
                      }
                    }}
                    className={cn(
                      'px-3 py-2 text-sm font-medium transition-colors',
                      quickUnit === 'hours'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background text-muted-foreground hover:bg-muted'
                    )}
                  >
                    Hours
                  </button>
                </div>
                <Button variant="secondary" size="sm" onClick={applyQuickSet}>
                  Apply
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">Or set hours, minutes, seconds below</p>

              <div className="flex items-center justify-center gap-2">
                <div className="text-center">
                  <label className="text-xs text-muted-foreground block mb-1">Hours</label>
                  <Input
                    type="number"
                    value={hours}
                    onChange={(e) => handleInputChange('hours', e.target.value)}
                    onBlur={(e) => handleInputBlur('hours', e)}
                    className="w-20 text-center text-lg font-medium"
                    min={0}
                    max={99}
                  />
                </div>
                <span className="text-2xl text-muted-foreground mt-5">:</span>
                <div className="text-center">
                  <label className="text-xs text-muted-foreground block mb-1">Minutes</label>
                  <Input
                    type="number"
                    value={minutes}
                    onChange={(e) => handleInputChange('minutes', e.target.value)}
                    onBlur={(e) => handleInputBlur('minutes', e)}
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
                    onBlur={(e) => handleInputBlur('seconds', e)}
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
              <Button variant="ghost" size="sm" onClick={saveAsDefault} className="text-muted-foreground">
                Set current as default
              </Button>
            </div>
          )}

          {/* Controls: Start, Pause, Resume, Reset */}
          <div className="flex flex-wrap justify-center gap-3">
            {(showFocusDurationControls || showPomodoroStart) && (
              <Button
                size="lg"
                onClick={handleStart}
                className="px-10 min-h-[52px] tap-target"
                disabled={mode === 'focus' && hours === 0 && minutes === 0 && seconds === 0}
              >
                <Play className="w-5 h-5 mr-2" />
                Start
              </Button>
            )}
            {isRunning && (
              <Button size="lg" variant="outline" onClick={handlePause} className="px-10 min-h-[52px] tap-target">
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </Button>
            )}
            {isPaused && (
              <Button size="lg" variant="outline" onClick={handleResume} className="px-8">
                <Play className="w-5 h-5 mr-2" />
                Resume
              </Button>
            )}
            {(isTimerMode || isComplete || isFinished) && (
              <Button size="lg" variant="ghost" onClick={handleReset}>
                <RotateCcw className="w-5 h-5 mr-2" />
                Reset
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

      {/* First-use tip */}
      <div className="text-center text-sm text-muted-foreground">
        <p>💡 Start with a 25-minute focus block, then take a short break.</p>
      </div>
    </div>
  );
}
