import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, FileQuestion, Target, ChevronDown, Upload, X, Lock, Unlock, Plus, TrendingUp } from 'lucide-react';
import { MedicalSystem, DailyTask } from '@/types';
import { ProgressBar } from '@/components/ProgressBar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useUserLocalStorage } from '@/hooks/useUserLocalStorage';
import { StudySessionBlock } from '@/components/StudySessionBlock';
import { StreakCard } from '@/components/StreakCard';
import { WeeklyRecapCard } from '@/components/WeeklyRecapCard';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, RadialBarChart, RadialBar, Legend } from 'recharts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface DashboardProps {
  systems: MedicalSystem[];
  selectedNextSystemId: string | null;
  onSelectNextSystem: (id: string) => void;
  dailyTasks?: DailyTask[];
}

interface ImagePosition {
  x: number;
  y: number;
}

export function Dashboard({ systems, selectedNextSystemId, onSelectNextSystem, dailyTasks = [] }: DashboardProps) {
  const { user } = useAuth();
  const [dashboardImage, setDashboardImage] = useUserLocalStorage<string | null>('dashboard-image', null);
  const [imagePosition, setImagePosition] = useUserLocalStorage<ImagePosition>('dashboard-image-position', { x: 0, y: 0 });
  const [imageSize, setImageSize] = useUserLocalStorage<number>('dashboard-image-size', 200);
  const [imageLocked, setImageLocked] = useUserLocalStorage<boolean>('dashboard-image-locked', false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const [imageError, setImageError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ size: 0, x: 0, y: 0, posX: 0, posY: 0 });
  const [showControls, setShowControls] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setDashboardImage(dataUrl);
      setImageError(false);
    };
    reader.onerror = () => {
      setImageError(true);
      alert('Failed to load image');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveImage = () => {
    setDashboardImage(null);
    setImageError(false);
    setImagePosition({ x: 0, y: 0 });
    setImageSize(200);
    setImageLocked(false);
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (imageLocked) return;
    const target = e.target as HTMLElement;
    // Check for resize handles first
    if (target.closest('.resize-handle')) {
      // Resize handle logic is handled in the handle's own onMouseDown
      return;
    }
    // Don't start dragging if clicking on buttons or inputs
    if (target.closest('button, input')) return;
    e.preventDefault();
    setIsDragging(true);
    const container = document.querySelector('[data-dashboard-container]') as HTMLElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setDragStart({
      x: e.clientX - rect.left - imagePosition.x,
      y: e.clientY - rect.top - imagePosition.y,
    });
  }, [imagePosition, imageLocked]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing && resizeHandle) {
      const container = document.querySelector('[data-dashboard-container]') as HTMLElement;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      const deltaX = currentX - resizeStart.x;
      const deltaY = currentY - resizeStart.y;
      
      let deltaSize = 0;
      let deltaPosX = 0;
      let deltaPosY = 0;
      
      // Handle edge resizing - resize from the dragged edge, keep opposite edge fixed
      if (resizeHandle === 'top') {
        // Dragging down increases size, up decreases. Move position down to keep bottom fixed
        deltaSize = -deltaY; // Negative because dragging down (positive deltaY) should increase size
        deltaPosY = deltaY; // Move position down by the same amount
      } else if (resizeHandle === 'bottom') {
        // Dragging down increases size, up decreases. Position stays same (top fixed)
        deltaSize = deltaY;
      } else if (resizeHandle === 'left') {
        // Dragging right increases size, left decreases. Move position right to keep right edge fixed
        deltaSize = -deltaX; // Negative because dragging right (positive deltaX) should increase size
        deltaPosX = deltaX; // Move position right by the same amount
      } else if (resizeHandle === 'right') {
        // Dragging right increases size, left decreases. Position stays same (left fixed)
        deltaSize = deltaX;
      } else if (resizeHandle === 'top-left') {
        // Corner: use diagonal, adjust position to keep bottom-right fixed
        const delta = Math.max(Math.abs(deltaX), Math.abs(deltaY));
        deltaSize = -Math.min(deltaX, deltaY);
        deltaPosX = deltaX;
        deltaPosY = deltaY;
      } else if (resizeHandle === 'top-right') {
        // Corner: use dominant direction, adjust position to keep bottom-left fixed
        deltaSize = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : -deltaY;
        deltaPosY = deltaY;
      } else if (resizeHandle === 'bottom-left') {
        // Corner: use dominant direction, adjust position to keep top-right fixed
        deltaSize = Math.abs(deltaY) > Math.abs(deltaX) ? deltaY : -deltaX;
        deltaPosX = deltaX;
      } else if (resizeHandle === 'bottom-right') {
        // Corner: use diagonal, position stays same (top-left fixed)
        deltaSize = Math.max(deltaX, deltaY);
      }
      
      const newSize = Math.max(50, Math.min(800, resizeStart.size + deltaSize));
      const newPosX = resizeStart.posX + deltaPosX;
      const newPosY = resizeStart.posY + deltaPosY;
      
      setImageSize(newSize);
      setImagePosition({ x: newPosX, y: newPosY });
      return;
    }
    if (!isDragging || imageLocked) return;
    const container = document.querySelector('[data-dashboard-container]') as HTMLElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    // No boundary limits - allow dragging anywhere
    const newX = e.clientX - rect.left - dragStart.x;
    const newY = e.clientY - rect.top - dragStart.y;
    setImagePosition({ x: newX, y: newY });
  }, [isDragging, isResizing, dragStart, resizeStart, resizeHandle, imageLocked]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const stats = useMemo(() => {
    const totalBootcamp = systems.reduce((acc, s) => acc + s.bootcamp.total, 0);
    const completedBootcamp = systems.reduce((acc, s) => acc + s.bootcamp.completed, 0);
    const totalQbank = systems.reduce((acc, s) => acc + s.qbank.total, 0);
    const completedQbank = systems.reduce((acc, s) => acc + s.qbank.completed, 0);
    
    const bootcampPercent = totalBootcamp > 0 ? Math.round((completedBootcamp / totalBootcamp) * 100) : 0;
    const qbankPercent = totalQbank > 0 ? Math.round((completedQbank / totalQbank) * 100) : 0;
    
    // Calculate overall percent: average of enabled fields only
    const enabledFields = [totalBootcamp > 0 ? bootcampPercent : null, totalQbank > 0 ? qbankPercent : null].filter((p): p is number => p !== null);
    const overallPercent = enabledFields.length > 0 
      ? Math.round(enabledFields.reduce((acc, p) => acc + p, 0) / enabledFields.length)
      : 0;

    return {
      totalBootcamp,
      completedBootcamp,
      totalQbank,
      completedQbank,
      bootcampPercent,
      qbankPercent,
      overallPercent,
    };
  }, [systems]);

  const nextSystem = useMemo(() => {
    if (selectedNextSystemId) {
      return systems.find(s => s.id === selectedNextSystemId);
    }
    return systems.find(s => s.status !== 'completed') || systems[0];
  }, [systems, selectedNextSystemId]);

  const incompleteSystems = systems.filter(s => s.status !== 'completed');

  return (
    <div className="space-y-8 animate-fade-in relative" data-dashboard-container>
      {/* Draggable and resizable image */}
      {dashboardImage && !imageError ? (
        <div
          ref={imageRef}
          className={cn(
            'absolute z-10 select-none',
            imageLocked ? 'cursor-default' : isDragging ? 'cursor-grabbing' : 'cursor-move'
          )}
          style={{
            left: `${imagePosition.x}px`,
            top: `${imagePosition.y}px`,
          }}
          onMouseDown={handleMouseDown}
        >
          <div
            className="relative group rounded-lg shadow-lg overflow-hidden bg-background border-2 border-transparent hover:border-primary/50 transition-colors"
            style={{
              width: `${imageSize}px`,
              height: `${imageSize}px`,
            }}
          >
            <img
              src={dashboardImage}
              alt="Dashboard"
              className="w-full h-full object-contain"
              onError={() => setImageError(true)}
              draggable={false}
            />
            {!imageLocked && (
              <>
                {/* Edge resize handles */}
                <div
                  className="resize-handle absolute top-0 left-1/2 w-6 h-2 cursor-ns-resize bg-primary/50 hover:bg-primary border border-white rounded-sm z-20"
                  style={{ transform: 'translate(-50%, -50%)' }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsResizing(true);
                    setResizeHandle('top');
                    const container = document.querySelector('[data-dashboard-container]') as HTMLElement;
                    if (!container) return;
                    const rect = container.getBoundingClientRect();
                    setResizeStart({
                      size: imageSize,
                      posX: imagePosition.x,
                      posY: imagePosition.y,
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    });
                  }}
                />
                <div
                  className="resize-handle absolute bottom-0 left-1/2 w-6 h-2 cursor-ns-resize bg-primary/50 hover:bg-primary border border-white rounded-sm z-20"
                  style={{ transform: 'translate(-50%, 50%)' }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsResizing(true);
                    setResizeHandle('bottom');
                    const container = document.querySelector('[data-dashboard-container]') as HTMLElement;
                    if (!container) return;
                    const rect = container.getBoundingClientRect();
                    setResizeStart({
                      size: imageSize,
                      posX: imagePosition.x,
                      posY: imagePosition.y,
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    });
                  }}
                />
                <div
                  className="resize-handle absolute left-0 top-1/2 w-2 h-6 cursor-ew-resize bg-primary/50 hover:bg-primary border border-white rounded-sm z-20"
                  style={{ transform: 'translate(-50%, -50%)' }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsResizing(true);
                    setResizeHandle('left');
                    const container = document.querySelector('[data-dashboard-container]') as HTMLElement;
                    if (!container) return;
                    const rect = container.getBoundingClientRect();
                    setResizeStart({
                      size: imageSize,
                      posX: imagePosition.x,
                      posY: imagePosition.y,
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    });
                  }}
                />
                <div
                  className="resize-handle absolute right-0 top-1/2 w-2 h-6 cursor-ew-resize bg-primary/50 hover:bg-primary border border-white rounded-sm z-20"
                  style={{ transform: 'translate(50%, -50%)' }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsResizing(true);
                    setResizeHandle('right');
                    const container = document.querySelector('[data-dashboard-container]') as HTMLElement;
                    if (!container) return;
                    const rect = container.getBoundingClientRect();
                    setResizeStart({
                      size: imageSize,
                      posX: imagePosition.x,
                      posY: imagePosition.y,
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    });
                  }}
                />
                {/* Corner resize handles */}
                <div
                  className="resize-handle absolute top-0 left-0 w-4 h-4 cursor-nwse-resize bg-primary/50 hover:bg-primary border-2 border-white rounded-sm z-20"
                  style={{ transform: 'translate(-50%, -50%)' }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsResizing(true);
                    setResizeHandle('top-left');
                    const container = document.querySelector('[data-dashboard-container]') as HTMLElement;
                    if (!container) return;
                    const rect = container.getBoundingClientRect();
                    setResizeStart({
                      size: imageSize,
                      posX: imagePosition.x,
                      posY: imagePosition.y,
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    });
                  }}
                />
                <div
                  className="resize-handle absolute top-0 right-0 w-4 h-4 cursor-nesw-resize bg-primary/50 hover:bg-primary border-2 border-white rounded-sm z-20"
                  style={{ transform: 'translate(50%, -50%)' }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsResizing(true);
                    setResizeHandle('top-right');
                    const container = document.querySelector('[data-dashboard-container]') as HTMLElement;
                    if (!container) return;
                    const rect = container.getBoundingClientRect();
                    setResizeStart({
                      size: imageSize,
                      posX: imagePosition.x,
                      posY: imagePosition.y,
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    });
                  }}
                />
                <div
                  className="resize-handle absolute bottom-0 left-0 w-4 h-4 cursor-nesw-resize bg-primary/50 hover:bg-primary border-2 border-white rounded-sm z-20"
                  style={{ transform: 'translate(-50%, 50%)' }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsResizing(true);
                    setResizeHandle('bottom-left');
                    const container = document.querySelector('[data-dashboard-container]') as HTMLElement;
                    if (!container) return;
                    const rect = container.getBoundingClientRect();
                    setResizeStart({
                      size: imageSize,
                      posX: imagePosition.x,
                      posY: imagePosition.y,
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    });
                  }}
                />
                <div
                  className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-primary/50 hover:bg-primary border-2 border-white rounded-sm z-20"
                  style={{ transform: 'translate(50%, 50%)' }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsResizing(true);
                    setResizeHandle('bottom-right');
                    const container = document.querySelector('[data-dashboard-container]') as HTMLElement;
                    if (!container) return;
                    const rect = container.getBoundingClientRect();
                    setResizeStart({
                      size: imageSize,
                      posX: imagePosition.x,
                      posY: imagePosition.y,
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    });
                  }}
                />
              </>
            )}
            <div
              className={cn(
                'absolute inset-0 bg-black/50 transition-opacity flex flex-col items-center justify-center gap-2',
                showControls ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              )}
              onMouseEnter={() => setShowControls(true)}
              onMouseLeave={() => setShowControls(false)}
            >
              <div className="flex gap-2 mb-2 flex-wrap justify-center">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Replace
                </Button>
                <Button
                  variant={imageLocked ? 'default' : 'secondary'}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImageLocked(!imageLocked);
                  }}
                  title={imageLocked ? 'Unlock position' : 'Lock position'}
                >
                  {imageLocked ? (
                    <>
                      <Lock className="w-4 h-4 mr-1" />
                      Locked
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4 mr-1" />
                      Lock
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage();
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-xs text-white text-center">Size: {imageSize}px</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="absolute top-0 right-12 z-10">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="h-8 w-8"
            title="Add image"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Welcome Section */}
      <div>
        <p className="text-lg font-medium text-muted-foreground mb-1">
          Hello{user?.email ? `, ${user.email.split('@')[0].replace(/^./, (c) => c.toUpperCase())}` : ''}
        </p>
        <h1 className="text-3xl font-semibold text-foreground mb-2">Your work matters — you're training to save lives</h1>
        <p className="text-muted-foreground">Track your progress and stay organized</p>
      </div>

      {/* Start Study Session — systems as subjects, Videos/Qbank/custom as tasks */}
      <StudySessionBlock
        subjects={systems.map((s) => ({ id: s.id, name: s.name }))}
        tasks={systems.flatMap((s) => {
          const list: { id: string; label: string; subjectId?: string }[] = [];
          if (s.bootcamp.total > 0) list.push({ id: `bootcamp-${s.id}`, label: 'Videos', subjectId: s.id });
          if (s.qbank.total > 0) list.push({ id: `qbank-${s.id}`, label: 'Qbank questions', subjectId: s.id });
          (s.customTasks ?? []).forEach((t) => list.push({ id: t.id, label: t.label, subjectId: s.id }));
          return list;
        })}
      />

      {/* Streak & weekly recap */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StreakCard />
        <WeeklyRecapCard />
      </div>

      {/* Today */}
      <Link to="/daily" className="block max-w-[280px]">
          <div className="relative overflow-hidden rounded-lg border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/80 dark:bg-amber-950/30 shadow-sm hover:shadow-md transition-shadow p-3.5 pr-8 lg:sticky lg:top-6">
            <div className="absolute top-0 right-0 w-8 h-8 bg-amber-200/50 dark:bg-amber-800/30 rounded-bl-lg" aria-hidden />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-800/80 dark:text-amber-200/80 mb-2">Today</p>
            {(() => {
              const pending = dailyTasks.filter((t) => !t.completed);
              if (pending.length > 0) {
                return (
                  <ul className="space-y-1 text-sm text-foreground/90">
                    {pending.slice(0, 4).map((task) => (
                      <li key={task.id} className="truncate pl-3 border-l-2 border-amber-300/50 dark:border-amber-600/40">
                        {task.text}
                      </li>
                    ))}
                    {pending.length > 4 && (
                      <li className="text-xs text-muted-foreground pl-3 border-l-2 border-transparent">
                        +{pending.length - 4} more
                      </li>
                    )}
                  </ul>
                );
              }
              return (
                <p className="text-xs text-muted-foreground italic">
                  {dailyTasks.length > 0 ? 'All done for today' : 'Nothing on the list yet'}
                </p>
              );
            })()}
            <span className="inline-flex items-center gap-0.5 mt-2 text-[10px] font-medium text-amber-700/70 dark:text-amber-300/70">
              Daily tasks <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </Link>

      {/* Progress Visualization */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-medium text-foreground">Coverage Progress</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
          {/* Overall Progress Donut Chart */}
          <div className="flex flex-col items-center">
            <h3 className="text-sm font-medium text-muted-foreground mb-4 text-center">Overall Coverage</h3>
            <ChartContainer
              config={{
                completed: {
                  label: "Completed",
                  color: "hsl(var(--primary))",
                },
                remaining: {
                  label: "Remaining",
                  color: "hsl(var(--muted))",
                },
              }}
              className="h-[250px] w-full max-w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Completed', value: stats.overallPercent },
                      { name: 'Remaining', value: 100 - stats.overallPercent },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    <Cell fill="hsl(var(--primary))" />
                    <Cell fill="hsl(var(--muted))" />
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-3xl font-bold fill-foreground"
                  >
                    {stats.overallPercent}%
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="flex justify-center gap-6 mt-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-muted-foreground">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-muted"></div>
                <span className="text-muted-foreground">Remaining</span>
              </div>
            </div>
          </div>

          {/* Systems Progress Bar Chart */}
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-muted-foreground mb-4 text-center">Systems Coverage</h3>
            <ChartContainer
              config={{
                progress: {
                  label: "Progress",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-[250px] w-full max-w-full"
            >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={systems.map((system) => {
                      // Only calculate progress for systems that have been started
                      if (system.status === 'not-started') {
                        return {
                          name: system.name,
                          fullName: system.name,
                          progress: 0,
                          bootcamp: 0,
                          qbank: 0,
                          status: 'not-started',
                        };
                      }
                      const bootcampPercent = system.bootcamp.total > 0 
                        ? Math.round((system.bootcamp.completed / system.bootcamp.total) * 100) 
                        : 0;
                      const qbankPercent = system.qbank.total > 0 
                        ? Math.round((system.qbank.completed / system.qbank.total) * 100) 
                        : 0;
                      return {
                        name: system.name,
                        fullName: system.name,
                        progress: Math.round((bootcampPercent + qbankPercent) / 2),
                        bootcamp: bootcampPercent,
                        qbank: qbankPercent,
                        status: system.status,
                      };
                    })}
                    layout="vertical"
                    margin={{ top: 5, right: 10, left: 70, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={60}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      interval={0}
                    />
                  <ChartTooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-lg border bg-background p-3 shadow-sm">
                            <div className="font-medium mb-2">{data.fullName}</div>
                            <div className="text-sm space-y-1">
                              <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">Overall:</span>
                                <span className="font-medium">{data.progress}%</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">Videos:</span>
                                <span className="font-medium">{data.bootcamp}%</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">QBank:</span>
                                <span className="font-medium">{data.qbank}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="progress" 
                    fill="hsl(var(--primary))" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>

        {/* Metrics Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-1">{stats.bootcampPercent}%</div>
            <div className="text-sm text-muted-foreground">Videos Complete</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.completedBootcamp} / {stats.totalBootcamp}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-1">{stats.qbankPercent}%</div>
            <div className="text-sm text-muted-foreground">QBank Complete</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.completedQbank} / {stats.totalQbank}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {systems.filter(s => s.status === 'completed').length} / {systems.length}
            </div>
            <div className="text-sm text-muted-foreground">Systems Completed</div>
            <div className="text-xs text-muted-foreground mt-1">
              {Math.round((systems.filter(s => s.status === 'completed').length / systems.length) * 100)}% coverage
            </div>
          </div>
        </div>
      </div>

      {/* Next Up Section */}
      {nextSystem && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-foreground">Next Up</h2>
            <Link to="/systems">
              <Button variant="ghost" size="sm" className="text-primary">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-accent/30 border border-primary/10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <span className="text-4xl">{nextSystem.icon}</span>
                  <div className="text-left">
                    <div className="flex items-center gap-1">
                      <h3 className="font-medium text-foreground">{nextSystem.name}</h3>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">Click to change</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {incompleteSystems.map(system => (
                  <DropdownMenuItem
                    key={system.id}
                    onClick={() => onSelectNextSystem(system.id)}
                    className="flex items-center gap-2"
                  >
                    <span>{system.icon}</span>
                    <span>{system.name}</span>
                    {system.id === nextSystem.id && (
                      <span className="ml-auto text-xs text-primary">Current</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex-1 text-right">
              <p className="text-sm text-muted-foreground">
                {[
                  nextSystem.bootcamp.total > 0 && `${nextSystem.bootcamp.total - nextSystem.bootcamp.completed} videos`,
                  nextSystem.qbank.total > 0 && `${nextSystem.qbank.total - nextSystem.qbank.completed} questions`
                ].filter(Boolean).join(' • ')} remaining
              </p>
            </div>
            <Link to="/systems">
              <Button size="sm">Start</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
