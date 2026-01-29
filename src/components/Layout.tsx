import { ReactNode, useMemo, useState } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, ListTodo, Clock, BookOpen, Sun, Moon, CalendarDays, LogOut, LogIn, Languages, FileText, Target, Flame, Menu, Settings2, Square } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useTimer } from '@/contexts/TimerContext';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveStudySession } from '@/contexts/ActiveStudySessionContext';
import { TimerNotification } from '@/components/TimerNotification';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { cn } from '@/lib/utils';

const MAX_PINNED = 5;
const NAV_PINNED_KEY_PREFIX = 'study-flow-nav-pinned-';

interface LayoutProps {
  children: ReactNode;
}

type NavItem = { to: string; icon: typeof LayoutDashboard; label: string };

const medicineNavItems: NavItem[] = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/systems', icon: BookOpen, label: 'Systems' },
  { to: '/planner', icon: CalendarDays, label: 'Planner' },
  { to: '/languages', icon: Languages, label: 'Languages' },
  { to: '/daily', icon: ListTodo, label: 'Daily Tasks' },
  { to: '/activity', icon: Flame, label: 'Activity' },
  { to: '/notebook', icon: FileText, label: 'Notebook' },
  { to: '/timer', icon: Clock, label: 'Timer' },
];

const genericNavItems: NavItem[] = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/subjects', icon: BookOpen, label: 'Subjects' },
  { to: '/daily', icon: ListTodo, label: 'Daily Tasks' },
  { to: '/activity', icon: Flame, label: 'Activity' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/notebook', icon: FileText, label: 'Notebook' },
  { to: '/timer', icon: Clock, label: 'Timer' },
];

function getDefaultPinned(items: NavItem[]): string[] {
  return items.slice(0, MAX_PINNED).map((i) => i.to);
}

function normalizePinned(stored: string[], items: NavItem[]): string[] {
  const set = new Set(items.map((i) => i.to));
  const valid = stored.filter((p) => set.has(p)).slice(0, MAX_PINNED);
  if (valid.length >= MAX_PINNED) return valid;
  for (const item of items) {
    if (valid.length >= MAX_PINNED) break;
    if (!valid.includes(item.to)) valid.push(item.to);
  }
  return valid;
}

function ActiveStudySessionBar() {
  const { active, elapsedSeconds, endSession } = useActiveStudySession();
  if (!active) return null;
  const m = Math.floor(elapsedSeconds / 60);
  const s = elapsedSeconds % 60;
  const timeStr = `${m}:${s.toString().padStart(2, '0')}`;
  return (
    <div className="bg-primary/10 border-b border-primary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-sm font-mono tabular-nums">{timeStr}</span>
          </div>
          <div>
            <p className="font-medium text-foreground text-sm">Study session in progress</p>
            <p className="text-xs text-muted-foreground">
              {active.subjectName || 'No subject'}
              {active.taskLabel ? ` · ${active.taskLabel}` : ''}
            </p>
          </div>
        </div>
        <Button onClick={endSession} variant="destructive" size="sm">
          <Square className="w-4 h-4 mr-2" />
          End session
        </Button>
      </div>
    </div>
  );
}

export function Layout({ children }: LayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const { timeLeft, isRunning } = useTimer();
  const { user, signOut } = useAuth();
  const isMedicine = user?.major?.toLowerCase() === 'medicine';
  const navItems = isMedicine ? medicineNavItems : genericNavItems;
  const majorKey = isMedicine ? 'medicine' : 'generic';
  const [storedPinned, setStoredPinned] = useLocalStorage<string[]>(
    NAV_PINNED_KEY_PREFIX + majorKey,
    getDefaultPinned(navItems)
  );
  const pinned = useMemo(() => normalizePinned(storedPinned, navItems), [storedPinned, navItems]);
  const pinnedItems = useMemo(
    () => pinned.map((path) => navItems.find((i) => i.to === path)).filter(Boolean) as NavItem[],
    [pinned, navItems]
  );
  const overflowItems = useMemo(
    () => navItems.filter((i) => !pinned.includes(i.to)),
    [navItems, pinned]
  );
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [customizeSelected, setCustomizeSelected] = useState<string[]>(() => pinned);

  const formatMiniTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const openCustomize = () => {
    setCustomizeSelected([...pinned]);
    setCustomizeOpen(true);
  };

  const toggleCustomizeItem = (path: string) => {
    setCustomizeSelected((prev) => {
      if (prev.includes(path)) return prev.filter((p) => p !== path);
      if (prev.length >= MAX_PINNED) return [...prev.slice(1), path];
      return [...prev, path];
    });
  };

  const saveCustomize = () => {
    setStoredPinned(customizeSelected.length <= MAX_PINNED ? customizeSelected : customizeSelected.slice(0, MAX_PINNED));
    setCustomizeOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Timer Notification */}
      <TimerNotification />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center shadow-sm">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary-foreground"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="font-semibold text-lg text-foreground hidden sm:block">Tracker</span>
            </div>

            {/* Top 5 nav + overflow menu */}
            <nav className="flex items-center gap-1">
              {pinnedItems.map((item) => {
                const isActive = location.pathname === item.to;
                const showTimer = item.to === '/timer' && isRunning && location.pathname !== '/timer';
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="hidden md:inline">{item.label}</span>
                    {showTimer && (
                      <span className="ml-1 px-2 py-0.5 text-xs font-mono bg-primary/20 text-primary rounded-full animate-pulse">
                        {formatMiniTimer(timeLeft)}
                      </span>
                    )}
                  </NavLink>
                );
              })}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" aria-label="More pages">
                    <Menu className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[180px]">
                  {overflowItems.map((item) => {
                    const isActive = location.pathname === item.to;
                    return (
                      <DropdownMenuItem key={item.to} asChild>
                        <NavLink to={item.to} className={cn('flex items-center gap-2', isActive && 'bg-accent text-accent-foreground')}>
                          <item.icon className="w-4 h-4" />
                          {item.label}
                        </NavLink>
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={openCustomize} className="gap-2">
                    <Settings2 className="w-4 h-4" />
                    Customize top 5
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            {/* User menu & Theme */}
            <div className="flex items-center gap-1">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <span className="hidden sm:inline truncate max-w-[140px]">{user.email}</span>
                      <span className="sm:hidden">Account</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem className="text-muted-foreground cursor-default">
                      {user.email}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <LogIn className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Sign in</span>
                  </Button>
                </Link>
              )}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Active study session bar — visible on every page */}
      <ActiveStudySessionBar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Customize top 5 dialog */}
      <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
        <DialogContent className="sm:max-w-sm p-4 gap-3">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base">Choose your top 5</DialogTitle>
            <DialogDescription className="text-xs">
              Select up to 5 pages for the top bar. Rest go in the menu (☰).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5 py-1">
            {navItems.map((item) => (
              <label
                key={item.to}
                className={cn(
                  'flex items-center gap-2 rounded-md border p-2 cursor-pointer transition-colors text-sm',
                  customizeSelected.includes(item.to) ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                )}
              >
                <Checkbox
                  checked={customizeSelected.includes(item.to)}
                  onCheckedChange={() => toggleCustomizeItem(item.to)}
                  className="h-3 w-3"
                />
                <item.icon className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="font-medium">{item.label}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {customizeSelected.length} of {MAX_PINNED} selected.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCustomizeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveCustomize}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
