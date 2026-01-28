import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, FileQuestion, Target, ChevronDown } from 'lucide-react';
import { MedicalSystem } from '@/types';
import { ProgressBar } from '@/components/ProgressBar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DashboardProps {
  systems: MedicalSystem[];
  selectedNextSystemId: string | null;
  onSelectNextSystem: (id: string) => void;
}

export function Dashboard({ systems, selectedNextSystemId, onSelectNextSystem }: DashboardProps) {
  const stats = useMemo(() => {
    const totalBootcamp = systems.reduce((acc, s) => acc + s.bootcamp.total, 0);
    const completedBootcamp = systems.reduce((acc, s) => acc + s.bootcamp.completed, 0);
    const totalQbank = systems.reduce((acc, s) => acc + s.qbank.total, 0);
    const completedQbank = systems.reduce((acc, s) => acc + s.qbank.completed, 0);
    
    const bootcampPercent = totalBootcamp > 0 ? Math.round((completedBootcamp / totalBootcamp) * 100) : 0;
    const qbankPercent = totalQbank > 0 ? Math.round((completedQbank / totalQbank) * 100) : 0;
    const overallPercent = Math.round((bootcampPercent + qbankPercent) / 2);

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
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">Welcome back</h1>
        <p className="text-muted-foreground">Track your USMLE Step 1 progress</p>
      </div>

      {/* Overall Progress Card */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-medium text-foreground">Overall Progress</h2>
            <p className="text-sm text-muted-foreground">Your Step 1 journey</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-semibold text-gradient">{stats.overallPercent}%</p>
            <p className="text-xs text-muted-foreground">Complete</p>
          </div>
        </div>
        <ProgressBar 
          value={stats.overallPercent} 
          max={100} 
          size="lg"
          variant={stats.overallPercent === 100 ? 'success' : 'default'}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Bootcamp Videos</span>
          </div>
          <p className="text-2xl font-semibold text-foreground">
            {stats.completedBootcamp}
            <span className="text-base font-normal text-muted-foreground"> / {stats.totalBootcamp}</span>
          </p>
          <ProgressBar value={stats.completedBootcamp} max={stats.totalBootcamp} size="sm" className="mt-2" />
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileQuestion className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">QBank Questions</span>
          </div>
          <p className="text-2xl font-semibold text-foreground">
            {stats.completedQbank}
            <span className="text-base font-normal text-muted-foreground"> / {stats.totalQbank}</span>
          </p>
          <ProgressBar value={stats.completedQbank} max={stats.totalQbank} size="sm" className="mt-2" />
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Systems Completed</span>
          </div>
          <p className="text-2xl font-semibold text-foreground">
            {systems.filter(s => s.status === 'completed').length}
            <span className="text-base font-normal text-muted-foreground"> / {systems.length}</span>
          </p>
          <ProgressBar 
            value={systems.filter(s => s.status === 'completed').length} 
            max={systems.length} 
            size="sm" 
            className="mt-2"
            variant="success"
          />
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
                {nextSystem.bootcamp.total - nextSystem.bootcamp.completed} videos • {' '}
                {nextSystem.qbank.total - nextSystem.qbank.completed} questions remaining
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
