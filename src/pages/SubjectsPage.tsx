import { useState } from 'react';
import { Subject, CourseDailyCompletion } from '@/types';
import { CourseCard } from '@/components/CourseCard';
import { AddCourseDialog } from '@/components/AddCourseDialog';
import { AddCourseDailyTasksDialog } from '@/components/AddCourseDailyTasksDialog';
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
import { Save, Trash2 } from 'lucide-react';
import { IconPicker } from '@/components/IconPicker';
import { safeToDateString } from '@/lib/dateUtils';

const ICON_OPTIONS = [
  '📚', '📖', '📐', '🔬', '💼', '⚖️', '🎯', '📊', '🧮', '📝',
  '🏛️', '🌐', '💻', '🔧', '📈', '🎓', '✏️', '📋', '🗂️', '📌',
];

interface SubjectsPageProps {
  subjects: Subject[];
  courseDailyCompletions: CourseDailyCompletion[];
  onAddSubject: (subject: Omit<Subject, 'id'>) => void;
  onUpdateSubject: (id: string, updates: Partial<Subject>) => void;
  onDeleteSubject: (id: string) => void;
  onAddCourseDailyTask: (courseId: string, text: string) => void;
  onRemoveCourseDailyTask: (courseId: string, taskId: string) => void;
  getCourseDailyCompletion: (taskId: string, date: string) => boolean;
  onToggleCourseDailyCompletion: (taskId: string, date: string, completed: boolean) => void;
}

export function SubjectsPage({
  subjects,
  courseDailyCompletions,
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject,
  onAddCourseDailyTask,
  onRemoveCourseDailyTask,
  getCourseDailyCompletion,
  onToggleCourseDailyCompletion,
}: SubjectsPageProps) {
  const [selectedCourse, setSelectedCourse] = useState<Subject | null>(null);
  const [courseForTasksDialog, setCourseForTasksDialog] = useState<Subject | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('📚');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const courseForTasks = courseForTasksDialog
    ? subjects.find((s) => s.id === courseForTasksDialog.id) ?? courseForTasksDialog
    : null;

  const todayStr = safeToDateString(new Date());

  const getTodayProgress = (course: Subject) => {
    const tasks = course.dailyTasks ?? [];
    const total = tasks.length;
    const completed = tasks.filter((task) =>
      courseDailyCompletions.some(
        (c) => c.taskId === task.id && c.date === todayStr && c.completed
      )
    ).length;
    return { completed, total };
  };

  const openEditDialog = (course: Subject) => {
    setSelectedCourse(course);
    setEditName(course.name);
    setEditIcon(course.icon);
  };

  const handleSave = () => {
    if (!selectedCourse) return;
    onUpdateSubject(selectedCourse.id, {
      name: editName.trim(),
      icon: editIcon,
    });
    setSelectedCourse(null);
  };

  const handleDelete = () => {
    if (!selectedCourse) return;
    onDeleteSubject(selectedCourse.id);
    setSelectedCourse(null);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Courses</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Add courses and daily tasks. Check them off each day.
          </p>
        </div>
        <AddCourseDialog onAddCourse={onAddSubject} />
      </div>

      {subjects.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border bg-muted/20 py-16 px-6 text-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 text-2xl">
            📚
          </div>
          <p className="text-muted-foreground font-medium">No courses yet</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Add your first course and define what you want to accomplish each day.
          </p>
          <div className="mt-6">
            <AddCourseDialog onAddCourse={onAddSubject} />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {subjects.map((course) => {
            const { completed, total } = getTodayProgress(course);
            return (
              <div key={course.id} onClick={() => openEditDialog(course)}>
                <CourseCard
                  course={course}
                  todayCompleted={completed}
                  todayTotal={total}
                  onClick={() => openEditDialog(course)}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={!!selectedCourse}
        onOpenChange={(open) => !open && setSelectedCourse(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg">Edit course</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-1">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Course name"
                className="h-11"
              />
            </div>
            <IconPicker
              label="Icon"
              value={editIcon}
              onChange={setEditIcon}
              options={ICON_OPTIONS}
              size="sm"
            />
            <div className="flex gap-2 pt-2">
              {selectedCourse && (
                <Button
                  variant="outline"
                  className="flex-1 h-11"
                  onClick={() => {
                    setCourseForTasksDialog(selectedCourse);
                    setSelectedCourse(null);
                  }}
                >
                  Daily tasks
                </Button>
              )}
              <Button onClick={handleSave} className="flex-1 h-11 gap-2">
                <Save className="w-4 h-4" />
                Save
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => {
                  if (selectedCourse) {
                    setDeleteId(selectedCourse.id);
                    setSelectedCourse(null);
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete course?</AlertDialogTitle>
            <AlertDialogDescription>
              All daily tasks will be deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  onDeleteSubject(deleteId);
                  setDeleteId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddCourseDailyTasksDialog
        course={courseForTasks}
        open={!!courseForTasksDialog}
        onOpenChange={(open) => !open && setCourseForTasksDialog(null)}
        onAddTask={onAddCourseDailyTask}
        onRemoveTask={onRemoveCourseDailyTask}
        getCompletion={getCourseDailyCompletion}
        onToggleCompletion={onToggleCourseDailyCompletion}
      />
    </div>
  );
}
