import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface TimerState {
  targetTime: number | null; // Unix timestamp when timer ends
  totalSeconds: number; // Original duration in seconds
  isRunning: boolean;
  isComplete: boolean;
}

interface TimerContextType {
  timeLeft: number;
  totalSeconds: number;
  isRunning: boolean;
  isComplete: boolean;
  progress: number;
  startTimer: (hours: number, minutes: number, seconds: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  dismissNotification: () => void;
}

const TimerContext = createContext<TimerContextType | null>(null);

export function TimerProvider({ children }: { children: ReactNode }) {
  const [timerState, setTimerState] = useLocalStorage<TimerState>('study-timer', {
    targetTime: null,
    totalSeconds: 25 * 60,
    isRunning: false,
    isComplete: false,
  });

  const [timeLeft, setTimeLeft] = useState(0);

  // Calculate time left from target time
  useEffect(() => {
    const updateTimeLeft = () => {
      if (timerState.targetTime && timerState.isRunning) {
        const remaining = Math.max(0, Math.floor((timerState.targetTime - Date.now()) / 1000));
        setTimeLeft(remaining);
        
        if (remaining === 0 && !timerState.isComplete) {
          setTimerState(prev => ({ ...prev, isRunning: false, isComplete: true }));
          // Browser notification
          if (Notification.permission === 'granted') {
            new Notification('⏰ Timer Complete!', {
              body: 'Your focus session has ended.',
              icon: '/favicon.ico',
            });
          }
        }
      } else if (!timerState.isRunning && timerState.targetTime) {
        // Timer is paused - show the remaining time
        const remaining = Math.max(0, Math.floor((timerState.targetTime - Date.now()) / 1000));
        setTimeLeft(remaining > 0 ? remaining : 0);
      } else if (!timerState.targetTime) {
        setTimeLeft(timerState.totalSeconds);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [timerState.targetTime, timerState.isRunning, timerState.isComplete, timerState.totalSeconds, setTimerState]);

  const startTimer = useCallback((hours: number, minutes: number, seconds: number) => {
    const totalSecs = hours * 3600 + minutes * 60 + seconds;
    const targetTime = Date.now() + totalSecs * 1000;
    
    setTimerState({
      targetTime,
      totalSeconds: totalSecs,
      isRunning: true,
      isComplete: false,
    });

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [setTimerState]);

  const pauseTimer = useCallback(() => {
    if (timerState.isRunning && timerState.targetTime) {
      const remaining = Math.max(0, timerState.targetTime - Date.now());
      setTimerState(prev => ({
        ...prev,
        targetTime: Date.now() + remaining, // Store the pause point
        isRunning: false,
      }));
    }
  }, [timerState.isRunning, timerState.targetTime, setTimerState]);

  const resumeTimer = useCallback(() => {
    if (!timerState.isRunning && timeLeft > 0) {
      const targetTime = Date.now() + timeLeft * 1000;
      setTimerState(prev => ({
        ...prev,
        targetTime,
        isRunning: true,
      }));
    }
  }, [timerState.isRunning, timeLeft, setTimerState]);

  const resetTimer = useCallback(() => {
    setTimerState(prev => ({
      targetTime: null,
      totalSeconds: prev.totalSeconds,
      isRunning: false,
      isComplete: false,
    }));
  }, [setTimerState]);

  const dismissNotification = useCallback(() => {
    setTimerState(prev => ({
      ...prev,
      isComplete: false,
    }));
  }, [setTimerState]);

  const progress = timerState.totalSeconds > 0 
    ? ((timerState.totalSeconds - timeLeft) / timerState.totalSeconds) * 100 
    : 0;

  return (
    <TimerContext.Provider value={{
      timeLeft,
      totalSeconds: timerState.totalSeconds,
      isRunning: timerState.isRunning,
      isComplete: timerState.isComplete,
      progress,
      startTimer,
      pauseTimer,
      resumeTimer,
      resetTimer,
      dismissNotification,
    }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
}
