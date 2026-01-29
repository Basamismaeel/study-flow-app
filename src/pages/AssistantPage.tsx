import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, Bot, User, AlertCircle, Loader2, Sparkles, ImagePlus, Search, FileText } from 'lucide-react';
import {
  sendChatMessage,
  generatePlan,
  getInsights,
  imageToStructuredText,
  semanticSearch,
  indexForSearch,
  isAiAvailable,
  type ChatMessage,
  type AIContext,
} from '@/lib/ai';
import { useUserLocalStorage } from '@/hooks/useUserLocalStorage';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { DailyTask } from '@/types';
import type { Plan } from '@/types';
import type { Goal } from '@/types';

const MAX_PERSISTED_MESSAGES = 50;

function buildContextSummary(tasks: DailyTask[], plans: Plan[], goals: Goal[]): string {
  const completed = tasks.filter((t) => t.completed).length;
  const total = tasks.length;
  const plansSummary = plans.length
    ? `Plans: ${plans.length} (${plans.map((p) => p.name).join(', ')})`
    : '';
  const goalsSummary = goals.length
    ? `Goals: ${goals.length} (${goals.filter((g) => g.status !== 'completed').length} active)`
    : '';
  return [
    `Daily tasks: ${completed}/${total} completed`,
    plansSummary,
    goalsSummary,
  ]
    .filter(Boolean)
    .join('. ');
}

function buildIndexItems(tasks: DailyTask[], plans: Plan[], goals: Goal[]): Array<{ id: string; type: string; text: string; meta?: object }> {
  const items: Array<{ id: string; type: string; text: string; meta?: object }> = [];
  tasks.forEach((t) => items.push({ id: t.id, type: 'task', text: t.text, meta: { completed: t.completed } }));
  plans.forEach((p) => {
    items.push({ id: p.id, type: 'plan', text: `${p.name} (${p.totalDays} days, ${p.tasksPerDay} tasks/day)`, meta: {} });
    p.tasks.forEach((t) => items.push({ id: t.id, type: 'plan', text: t.name, meta: { planId: p.id, completed: t.completed } }));
  });
  goals.forEach((g) =>
    items.push({
      id: g.id,
      type: 'goal',
      text: [g.name, g.description].filter(Boolean).join(' '),
      meta: { status: g.status, targetYear: g.targetYear },
    })
  );
  return items;
}

export function AssistantPage() {
  const [tasks] = useUserLocalStorage<DailyTask[]>('usmle-daily-tasks', []);
  const [plans] = useUserLocalStorage<Plan[]>('study-flow-plans', []);
  const [goals] = useUserLocalStorage<Goal[]>('yearly-goals', []);

  const [messages, setMessages] = useUserLocalStorage<ChatMessage[]>('ai-chat-messages', []);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const summary = buildContextSummary(tasks, plans, goals);
  const context: AIContext = {
    page: 'AI Assistant',
    summary: summary || 'No tasks, plans, or goals yet.',
  };

  useEffect(() => {
    isAiAvailable().then(setAvailable);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setError(null);
    const userMessage: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage].slice(-MAX_PERSISTED_MESSAGES));
    setLoading(true);
    const { content, error: err } = await sendChatMessage(messages, text, context);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    setMessages((prev) => [...prev, { role: 'assistant', content }].slice(-MAX_PERSISTED_MESSAGES));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Bot className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-semibold text-foreground">AI Assistant</h1>
      </div>

      {available === false && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground">Backend or AI server may be unreachable</p>
            <p className="text-muted-foreground mt-1">
              You can still try sending a message. If the backend is running and <code className="bg-muted px-1 rounded">OLLAMA_HOST</code> points to your Ollama (e.g. EC2), replies will appear below.
            </p>
          </div>
        </div>
      )}

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="chat" className="gap-1">
            <Send className="w-3.5 h-3.5" /> Chat
          </TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="image">Image</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-4">
          <ChatTab
            messages={messages}
            input={input}
            setInput={setInput}
            loading={loading}
            error={error}
            setError={setError}
            handleSend={handleSend}
            scrollRef={scrollRef}
          />
        </TabsContent>

        <TabsContent value="plan" className="mt-4">
          <PlanTab />
        </TabsContent>

        <TabsContent value="insights" className="mt-4">
          <InsightsTab summary={summary} tasks={tasks} plans={plans} goals={goals} />
        </TabsContent>

        <TabsContent value="image" className="mt-4">
          <ImageTab />
        </TabsContent>

        <TabsContent value="search" className="mt-4">
          <SearchTab onIndex={() => indexForSearch(buildIndexItems(tasks, plans, goals))} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ChatTab({
  messages,
  input,
  setInput,
  loading,
  error,
  setError,
  handleSend,
  scrollRef,
}: {
  messages: ChatMessage[];
  input: string;
  setInput: (v: string) => void;
  loading: boolean;
  error: string | null;
  setError: (v: string | null) => void;
  handleSend: () => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="glass-card flex flex-col min-h-[400px] p-4">
      <ScrollArea className="flex-1 pr-4 -m-2 min-h-[280px]">
        <div className="space-y-4 p-2">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Ask about study planning, motivation, or next steps. I use your tasks, plans, and goals as context.
            </p>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {msg.role === 'assistant' && (
                <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[85%] rounded-lg px-4 py-2.5 text-sm',
                  msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                )}
              >
                <div className="whitespace-pre-wrap break-words">{msg.content}</div>
              </div>
              {msg.role === 'user' && (
                <div className="shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="rounded-lg px-4 py-2.5 bg-muted">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>
      {error && <p className="text-sm text-destructive mt-2 px-2">{error}</p>}
      <div className="flex gap-2 mt-4 pt-4 border-t">
        <Textarea
          placeholder="Ask something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          rows={2}
          className="min-h-0 resize-none"
          disabled={loading}
        />
        <Button onClick={handleSend} disabled={!input.trim() || loading} size="icon" className="shrink-0 h-[52px] w-12">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}

function PlanTab() {
  const [goal, setGoal] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState('');
  const [plan, setPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!goal.trim()) return;
    setLoading(true);
    setError(null);
    const num = hoursPerDay ? parseInt(hoursPerDay, 10) : undefined;
    const { plan: result, error: err } = await generatePlan({
      goal: goal.trim(),
      timeframe: timeframe.trim() || undefined,
      hoursPerDay: num && !isNaN(num) ? num : undefined,
    });
    setLoading(false);
    if (err) setError(err);
    else setPlan(result);
  };

  return (
    <div className="glass-card p-6 space-y-4">
      <p className="text-sm text-muted-foreground">
        Generate a realistic plan from your goal and availability (powered by local Ollama).
      </p>
      <div className="space-y-2">
        <Label>Goal</Label>
        <Input
          placeholder="e.g. Finish cardiovascular system videos"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Timeframe (optional)</Label>
          <Input placeholder="e.g. 4 weeks" value={timeframe} onChange={(e) => setTimeframe(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Hours per day (optional)</Label>
          <Input
            type="number"
            min={1}
            placeholder="e.g. 2"
            value={hoursPerDay}
            onChange={(e) => setHoursPerDay(e.target.value)}
          />
        </div>
      </div>
      <Button onClick={handleGenerate} disabled={!goal.trim() || loading} className="gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        Generate plan
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {plan && (
        <div className="rounded-lg border bg-muted/30 p-4">
          <Label className="text-muted-foreground">Generated plan</Label>
          <pre className="mt-2 text-sm whitespace-pre-wrap font-sans">{plan}</pre>
        </div>
      )}
    </div>
  );
}

function InsightsTab({
  summary,
  tasks,
  plans,
  goals,
}: {
  summary: string;
  tasks: DailyTask[];
  plans: Plan[];
  goals: Goal[];
}) {
  const [insights, setInsights] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dataSummary = [
    summary,
    tasks.length ? `Tasks: ${tasks.filter((t) => t.completed).length}/${tasks.length} completed.` : '',
    plans.length ? `Plans: ${plans.map((p) => `${p.name} (${p.tasks.filter((t) => t.completed).length}/${p.tasks.length} tasks)`).join('; ')}` : '',
    goals.length ? `Goals: ${goals.map((g) => `${g.name} (${g.status})`).join('; ')}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    const { insights: result, error: err } = await getInsights(dataSummary || 'No data yet.');
    setLoading(false);
    if (err) setError(err);
    else setInsights(result);
  };

  return (
    <div className="glass-card p-6 space-y-4">
      <p className="text-sm text-muted-foreground">
        Get productivity insights and overload warnings from your tasks, plans, and goals.
      </p>
      <Button onClick={handleAnalyze} disabled={loading} className="gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
        Analyze
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {insights && (
        <div className="rounded-lg border bg-muted/30 p-4">
          <Label className="text-muted-foreground">Insights</Label>
          <pre className="mt-2 text-sm whitespace-pre-wrap font-sans">{insights}</pre>
        </div>
      )}
    </div>
  );
}

function ImageTab() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.type.startsWith('image/')) setFile(f);
    else setFile(null);
  };

  const handleExtract = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    const { text: result, error: err } = await imageToStructuredText(file);
    setLoading(false);
    if (err) setError(err);
    else setText(result);
  };

  return (
    <div className="glass-card p-6 space-y-4">
      <p className="text-sm text-muted-foreground">
        Upload a note, schedule, or whiteboard. Gemini (free tier) extracts text and structure. Copy result into tasks or notes.
      </p>
      <div className="flex flex-wrap gap-2 items-center">
        <Input type="file" accept="image/*" onChange={handleFile} className="max-w-xs" />
        <Button onClick={handleExtract} disabled={!file || loading} className="gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
          Extract
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {text && (
        <div className="rounded-lg border bg-muted/30 p-4">
          <Label className="text-muted-foreground">Extracted</Label>
          <pre className="mt-2 text-sm whitespace-pre-wrap font-sans">{text}</pre>
        </div>
      )}
    </div>
  );
}

function SearchTab({ onIndex }: { onIndex: () => Promise<{ indexed: number; error?: string }> }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ id: string; type: string; text: string; score: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    const { results: r, error: err } = await semanticSearch(query.trim(), { limit: 10 });
    setLoading(false);
    if (err) setError(err);
    else setResults(r);
  };

  const handleIndex = async () => {
    setIndexing(true);
    setError(null);
    const { indexed, error: err } = await onIndex();
    setIndexing(false);
    if (err) setError(err);
    else setError(null);
  };

  return (
    <div className="glass-card p-6 space-y-4">
      <p className="text-sm text-muted-foreground">
        Semantic search over your tasks, plans, and goals. Index first, then search.
      </p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleIndex} disabled={indexing} className="gap-2">
          {indexing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Index my content
        </Button>
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Search by meaning..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={!query.trim() || loading}>Search</Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {results.length > 0 && (
        <ul className="space-y-2">
          {results.map((r) => (
            <li key={r.id} className="rounded-lg border bg-muted/30 p-3 text-sm">
              <span className="text-muted-foreground text-xs">{r.type}</span>
              <p className="mt-1">{r.text}</p>
              <span className="text-xs text-muted-foreground">score: {r.score.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
