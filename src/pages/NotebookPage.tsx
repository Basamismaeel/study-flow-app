import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Plus, Trash2, FileText, Edit2, X } from 'lucide-react';
import { safeFormat, safeParseDate } from '@/lib/dateUtils';
import { useUserLocalStorage } from '@/hooks/useUserLocalStorage';
import { RichTextEditor } from '@/components/RichTextEditor';
import type { Notebook, NotebookPage } from '@/types';
import { cn } from '@/lib/utils';

interface NotebooksState {
  notebooks: Notebook[];
  selectedNotebookId: string | null;
  selectedPageId: string | null;
}

function getInitialState(): NotebooksState {
  return { notebooks: [], selectedNotebookId: null, selectedPageId: null };
}

export function NotebookPage() {
  const [state, setState] = useUserLocalStorage<NotebooksState>(
    'notebooks',
    getInitialState()
  );
  const [newNotebookDialogOpen, setNewNotebookDialogOpen] = useState(false);
  const [newPageDialogOpen, setNewPageDialogOpen] = useState(false);
  const [editNotebookDialogOpen, setEditNotebookDialogOpen] = useState(false);
  const [editPageDialogOpen, setEditPageDialogOpen] = useState(false);
  const [deleteNotebookId, setDeleteNotebookId] = useState<string | null>(null);
  const [deletePageId, setDeletePageId] = useState<string | null>(null);
  const [notebookName, setNotebookName] = useState('');
  const [pageTitle, setPageTitle] = useState('');
  const [editingNotebookId, setEditingNotebookId] = useState<string | null>(null);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);

  const selectedNotebook = state.notebooks.find((n) => n.id === state.selectedNotebookId);
  const selectedPage = selectedNotebook?.pages.find((p) => p.id === state.selectedPageId);

  const handleAddNotebook = () => {
    if (!notebookName.trim()) return;
    const newNotebook: Notebook = {
      id: crypto.randomUUID(),
      name: notebookName.trim(),
      pages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setState((prev) => ({
      notebooks: [...prev.notebooks, newNotebook],
      selectedNotebookId: newNotebook.id,
      selectedPageId: null,
    }));
    setNotebookName('');
    setNewNotebookDialogOpen(false);
  };

  const handleAddPage = () => {
    if (!selectedNotebook || !pageTitle.trim()) return;
    const newPage: NotebookPage = {
      id: crypto.randomUUID(),
      title: pageTitle.trim(),
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setState((prev) => ({
      ...prev,
      notebooks: prev.notebooks.map((n) =>
        n.id === selectedNotebook.id
          ? {
              ...n,
              pages: [...n.pages, newPage],
              updatedAt: new Date(),
            }
          : n
      ),
      selectedPageId: newPage.id,
    }));
    setPageTitle('');
    setNewPageDialogOpen(false);
  };

  const handleUpdatePageContent = (content: string) => {
    if (!selectedNotebook || !selectedPage) return;
    setState((prev) => ({
      ...prev,
      notebooks: prev.notebooks.map((n) =>
        n.id === selectedNotebook.id
          ? {
              ...n,
              pages: n.pages.map((p) =>
                p.id === selectedPage.id
                  ? { ...p, content, updatedAt: new Date() }
                  : p
              ),
              updatedAt: new Date(),
            }
          : n
      ),
    }));
  };

  const handleUpdatePageTitle = (pageId: string, title: string) => {
    if (!selectedNotebook) return;
    setState((prev) => ({
      ...prev,
      notebooks: prev.notebooks.map((n) =>
        n.id === selectedNotebook.id
          ? {
              ...n,
              pages: n.pages.map((p) =>
                p.id === pageId ? { ...p, title: title.trim(), updatedAt: new Date() } : p
              ),
              updatedAt: new Date(),
            }
          : n
      ),
    }));
  };

  const handleUpdateNotebookName = (notebookId: string, name: string) => {
    setState((prev) => ({
      ...prev,
      notebooks: prev.notebooks.map((n) =>
        n.id === notebookId ? { ...n, name: name.trim(), updatedAt: new Date() } : n
      ),
    }));
  };

  const handleDeleteNotebook = () => {
    if (!deleteNotebookId) return;
    setState((prev) => {
      const updatedNotebooks = prev.notebooks.filter((n) => n.id !== deleteNotebookId);
      const nextSelectedNotebookId =
        prev.selectedNotebookId === deleteNotebookId
          ? updatedNotebooks[0]?.id ?? null
          : prev.selectedNotebookId;
      return {
        notebooks: updatedNotebooks,
        selectedNotebookId: nextSelectedNotebookId,
        selectedPageId: null,
      };
    });
    setDeleteNotebookId(null);
  };

  const handleDeletePage = () => {
    if (!selectedNotebook || !deletePageId) return;
    setState((prev) => {
      const updatedNotebooks = prev.notebooks.map((n) =>
        n.id === selectedNotebook.id
          ? {
              ...n,
              pages: n.pages.filter((p) => p.id !== deletePageId),
              updatedAt: new Date(),
            }
          : n
      );
      const nextSelectedPageId =
        prev.selectedPageId === deletePageId
          ? updatedNotebooks.find((n) => n.id === selectedNotebook.id)?.pages[0]?.id ?? null
          : prev.selectedPageId;
      return {
        ...prev,
        notebooks: updatedNotebooks,
        selectedPageId: nextSelectedPageId,
      };
    });
    setDeletePageId(null);
  };

  const openEditNotebookDialog = (notebookId: string) => {
    const notebook = state.notebooks.find((n) => n.id === notebookId);
    if (notebook) {
      setEditingNotebookId(notebookId);
      setNotebookName(notebook.name);
      setEditNotebookDialogOpen(true);
    }
  };

  const openEditPageDialog = (pageId: string) => {
    if (selectedNotebook) {
      const page = selectedNotebook.pages.find((p) => p.id === pageId);
      if (page) {
        setEditingPageId(pageId);
        setPageTitle(page.title);
        setEditPageDialogOpen(true);
      }
    }
  };

  const handleSaveNotebookEdit = () => {
    if (!editingNotebookId || !notebookName.trim()) return;
    handleUpdateNotebookName(editingNotebookId, notebookName);
    setEditNotebookDialogOpen(false);
    setEditingNotebookId(null);
    setNotebookName('');
  };

  const handleSavePageEdit = () => {
    if (!editingPageId || !pageTitle.trim()) return;
    handleUpdatePageTitle(editingPageId, pageTitle);
    setEditPageDialogOpen(false);
    setEditingPageId(null);
    setPageTitle('');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2 flex items-center gap-2">
            <FileText className="w-8 h-8 text-primary" />
            Notebook
          </h1>
          <p className="text-muted-foreground">Organize your notes with multiple notebooks and pages</p>
        </div>
        <Button onClick={() => setNewNotebookDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Notebook
        </Button>
      </div>

      {state.notebooks.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground mb-2">No notebooks yet</h3>
          <p className="text-muted-foreground mb-4">Create your first notebook to start taking notes</p>
          <Button onClick={() => setNewNotebookDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Notebook
          </Button>
        </div>
      ) : (
        <div className="flex gap-6 h-[calc(100vh-300px)] min-h-[600px]">
          {/* Sidebar - Notebooks */}
          <div className="w-64 shrink-0 glass-card p-4 flex flex-col">
            <div className="mb-4">
              <h2 className="text-sm font-medium text-muted-foreground mb-2">Notebooks</h2>
              <div className="space-y-1 max-h-[200px] overflow-y-auto">
                {state.notebooks.map((notebook) => (
                  <div
                    key={notebook.id}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors group',
                      state.selectedNotebookId === notebook.id
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted/50'
                    )}
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        selectedNotebookId: notebook.id,
                        selectedPageId: notebook.pages[0]?.id ?? null,
                      }))
                    }
                  >
                    <FileText className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-sm font-medium truncate">{notebook.name}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditNotebookDialog(notebook.id);
                        }}
                        className="p-1 hover:bg-muted rounded"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteNotebookId(notebook.id);
                        }}
                        className="p-1 hover:bg-destructive/20 rounded text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pages List */}
            {selectedNotebook && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-medium text-muted-foreground">Pages</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    onClick={() => setNewPageDialogOpen(true)}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-1">
                  {selectedNotebook.pages.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No pages yet
                    </p>
                  ) : (
                    selectedNotebook.pages.map((page) => (
                      <div
                        key={page.id}
                        className={cn(
                          'flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors group',
                          state.selectedPageId === page.id
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted/50'
                        )}
                        onClick={() =>
                          setState((prev) => ({
                            ...prev,
                            selectedPageId: page.id,
                          }))
                        }
                      >
                        <FileText className="w-3 h-3 shrink-0" />
                        <span className="flex-1 text-xs truncate">{page.title}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditPageDialog(page.id);
                            }}
                            className="p-1 hover:bg-muted rounded"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletePageId(page.id);
                            }}
                            className="p-1 hover:bg-destructive/20 rounded text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 glass-card p-6 flex flex-col min-w-0">
            {selectedPage ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-foreground">{selectedPage.title}</h2>
                  <div className="text-xs text-muted-foreground">
                    Updated: {safeFormat(safeParseDate(selectedPage.updatedAt), 'MMM d, yyyy')}
                  </div>
                </div>
                <RichTextEditor
                  value={selectedPage.content}
                  onChange={handleUpdatePageContent}
                  placeholder="Start writing your notes here..."
                  className="flex-1"
                />
              </>
            ) : selectedNotebook ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No page selected</h3>
                  <p className="text-muted-foreground mb-4">
                    {selectedNotebook.pages.length === 0
                      ? 'Create your first page to start taking notes'
                      : 'Select a page from the sidebar or create a new one'}
                  </p>
                  <Button onClick={() => setNewPageDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Page
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Select a notebook</h3>
                  <p className="text-muted-foreground">Choose a notebook from the sidebar to view its pages</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Notebook Dialog */}
      <Dialog open={newNotebookDialogOpen} onOpenChange={setNewNotebookDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Notebook</DialogTitle>
            <DialogDescription>Create a new notebook to organize your notes</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="notebook-name">Notebook Name</Label>
              <Input
                id="notebook-name"
                value={notebookName}
                onChange={(e) => setNotebookName(e.target.value)}
                placeholder="e.g., Medical Notes"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddNotebook();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewNotebookDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNotebook} disabled={!notebookName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Page Dialog */}
      <Dialog open={newPageDialogOpen} onOpenChange={setNewPageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Page</DialogTitle>
            <DialogDescription>Add a new page to this notebook</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="page-title">Page Title</Label>
              <Input
                id="page-title"
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
                placeholder="e.g., Chapter 1 Notes"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPage();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewPageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPage} disabled={!pageTitle.trim() || !selectedNotebook}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Notebook Dialog */}
      <Dialog open={editNotebookDialogOpen} onOpenChange={setEditNotebookDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Notebook</DialogTitle>
            <DialogDescription>Rename your notebook</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-notebook-name">Notebook Name</Label>
              <Input
                id="edit-notebook-name"
                value={notebookName}
                onChange={(e) => setNotebookName(e.target.value)}
                placeholder="Notebook name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveNotebookEdit();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditNotebookDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNotebookEdit} disabled={!notebookName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Page Dialog */}
      <Dialog open={editPageDialogOpen} onOpenChange={setEditPageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Page</DialogTitle>
            <DialogDescription>Rename your page</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-page-title">Page Title</Label>
              <Input
                id="edit-page-title"
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
                placeholder="Page title"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSavePageEdit();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePageEdit} disabled={!pageTitle.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Notebook Confirmation */}
      <AlertDialog open={!!deleteNotebookId} onOpenChange={() => setDeleteNotebookId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notebook?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this notebook and all its pages. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteNotebook}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Page Confirmation */}
      <AlertDialog open={!!deletePageId} onOpenChange={() => setDeletePageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Page?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this page. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePage}
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
