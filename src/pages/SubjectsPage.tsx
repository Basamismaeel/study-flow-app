import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Subject,
  SubjectTrackingItem,
  subjectStatus,
  GenericTask,
} from '@/types';
import { useStudySessions } from '@/hooks/useStudySessions';
import { SubjectCard } from '@/components/SubjectCard';
import { AddSubjectDialog } from '@/components/AddSubjectDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Minus, Plus, Save, Trash2, ArrowRight } from 'lucide-react';

const ICON_OPTIONS = [
  '📚', '📖', '📐', '🔬', '💼', '⚖️', '🎯', '📊', '🧮', '📝',
  '🏛️', '🌐', '💻', '🔧', '📈', '🎓', '✏️', '📋', '🗂️', '📌',
];

interface SubjectsPageProps {
  subjects: Subject[];
  subjectTasks: GenericTask[];
  onAddSubject: (subject: Omit<Subject, 'id'>) => void;
  onUpdateSubject: (id: string, updates: Partial<Subject>) => void;
  onDeleteSubject: (id: string) => void;
}

function newTrackingItem(): SubjectTrackingItem {
  return {
    id: crypto.randomUUID(),
    label: '',
    completed: 0,
    total: 0,
  };
}

export function SubjectsPage({
  subjects,
  subjectTasks,
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject,
}: SubjectsPageProps) {
  const { sessions } = useStudySessions();
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('📚');
  const [editTracking, setEditTracking] = useState<SubjectTrackingItem[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openEditDialog = (subject: Subject) => {
    setSelectedSubject(subject);
    setEditName(subject.name);
    setEditIcon(subject.icon);
    setEditTracking(
      subject.tracking.length > 0
        ? subject.tracking.map((t) => ({ ...t }))
        : [newTrackingItem()]
    );
  };

  const addEditTrackingItem = () => {
    setEditTracking((prev) => [...prev, newTrackingItem()]);
  };

  const removeEditTrackingItem = (id: string) => {
    setEditTracking((prev) => prev.filter((t) => t.id !== id));
  };

  const updateEditTrackingItem = (
    id: string,
    updates: Partial<SubjectTrackingItem>
  ) => {
    setEditTracking((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const adjustCompleted = (id: string, delta: number) => {
    setEditTracking((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const total = Math.max(0, t.total);
        const completed = Math.max(0, Math.min(total, t.completed + delta));
        return { ...t, completed };
      })
    );
  };

  const handleSave = () => {
    if (!selectedSubject) return;

    const items = editTracking
      .filter((t) => t.label.trim() || t.total > 0)
      .map((t) => ({
        ...t,
        total: Math.max(0, t.total),
        completed: Math.min(
          Math.max(0, t.completed),
          Math.max(0, t.total)
        ),
      }));
    const status = subjectStatus(items);

    onUpdateSubject(selectedSubject.id, {
      name: editName.trim(),
      icon: editIcon,
      tracking: items,
      status,
    });
    setSelectedSubject(null);
  };

  const handleDelete = () => {
    if (!selectedSubject) return;
    onDeleteSubject(selectedSubject.id);
    setSelectedSubject(null);
  };

  const handleDeleteConfirm = () => {
    if (deleteId) {
      onDeleteSubject(deleteId);
      setDeleteId(null);
    }
  };

  const completedSubjects = subjects.filter((s) => s.status === 'completed');
  const inProgressSubjects = subjects.filter((s) => s.status === 'in-progress');
  const notStartedSubjects = subjects.filter((s) => s.status === 'not-started');

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">
            Subjects Tracker
          </h1>
          <p className="text-muted-foreground">
            Track progress by subject — same as Systems, fully customizable
          </p>
        </div>
        <AddSubjectDialog onAddSubject={onAddSubject} />
      </div>

      {completedSubjects.length > 0 && (
        <section>
          <h2 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success" />
            Completed ({completedSubjects.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedSubjects.map((subject) => (
              <div
                key={subject.id}
                onClick={() => openEditDialog(subject)}
                className="cursor-pointer"
              >
                <SubjectCard subject={subject} sessions={sessions} />
              </div>
            ))}
          </div>
        </section>
      )}

      {inProgressSubjects.length > 0 && (
        <section>
          <h2 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-warning" />
            In Progress ({inProgressSubjects.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgressSubjects.map((subject) => (
              <div
                key={subject.id}
                onClick={() => openEditDialog(subject)}
                className="cursor-pointer"
              >
                <SubjectCard subject={subject} sessions={sessions} />
              </div>
            ))}
          </div>
        </section>
      )}

      {notStartedSubjects.length > 0 && (
        <section>
          <h2 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-muted-foreground" />
            Not Started ({notStartedSubjects.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notStartedSubjects.map((subject) => (
              <div
                key={subject.id}
                onClick={() => openEditDialog(subject)}
                className="cursor-pointer"
              >
                <SubjectCard subject={subject} sessions={sessions} />
              </div>
            ))}
          </div>
        </section>
      )}

      {subjects.length === 0 && (
        <div className="glass-card p-12 text-center">
          <p className="text-muted-foreground mb-4">
            No subjects yet. Add a subject and optional tracking items (e.g. Videos, Chapters).
          </p>
          <AddSubjectDialog onAddSubject={onAddSubject} />
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={!!selectedSubject}
        onOpenChange={(open) => !open && setSelectedSubject(null)}
      >
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="text-2xl">{editIcon}</span>
              {selectedSubject?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Subject name"
              />
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {ICON_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setEditIcon(emoji)}
                    className={`w-10 h-10 text-xl rounded-lg border-2 transition-all ${
                      editIcon === emoji
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Tracking</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addEditTrackingItem}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
              {editTracking.map((t) => (
                <div key={t.id} className="space-y-2 rounded-lg border p-3">
                  <div className="flex gap-2 items-center">
                    <Input
                      value={t.label}
                      onChange={(e) =>
                        updateEditTrackingItem(t.id, { label: e.target.value })
                      }
                      placeholder="Label (e.g. Videos, Chapters)"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEditTrackingItem(t.id)}
                      className="text-destructive shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="shrink-0 w-20">Total</Label>
                    <Input
                      type="number"
                      min={0}
                      value={t.total || ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '') {
                          updateEditTrackingItem(t.id, { total: 0 });
                          return;
                        }
                        const n = parseInt(v, 10);
                        if (!isNaN(n))
                          updateEditTrackingItem(t.id, {
                            total: Math.max(0, n),
                            completed: Math.min(t.completed, Math.max(0, n)),
                          });
                      }}
                      className="w-24"
                    />
                    <Label className="shrink-0">Completed</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => adjustCompleted(t.id, -1)}
                      disabled={t.completed <= 0}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      min={0}
                      max={t.total}
                      value={t.completed}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '') {
                          updateEditTrackingItem(t.id, { completed: 0 });
                          return;
                        }
                        const n = parseInt(v, 10);
                        if (!isNaN(n))
                          updateEditTrackingItem(t.id, {
                            completed: Math.max(
                              0,
                              Math.min(t.total, n)
                            ),
                          });
                      }}
                      className="w-16 text-center"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => adjustCompleted(t.id, 1)}
                      disabled={t.completed >= t.total}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      / {t.total}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            {selectedSubject && (
              <Link
                to={`/subjects/${selectedSubject.id}`}
                className="flex-1"
                onClick={() => setSelectedSubject(null)}
              >
                <Button variant="outline" className="w-full">
                  Tasks <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            )}
            <Button onClick={handleSave} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => {
                if (selectedSubject) {
                  setDeleteId(selectedSubject.id);
                  setSelectedSubject(null);
                }
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete subject?</AlertDialogTitle>
            <AlertDialogDescription>
              All tasks in this subject will also be deleted. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
