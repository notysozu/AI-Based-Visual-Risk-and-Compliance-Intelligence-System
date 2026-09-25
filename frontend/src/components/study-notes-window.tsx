import { useState, useEffect, useRef, useMemo } from "react";
import {
  FileText,
  Plus,
  Search,
  Pin,
  Trash2,
  Copy,
  Check,
  Tag,
  Sparkles,
  Move,
  X,
  Maximize2,
  Minimize2,
  Lightbulb,
  BookOpen,
  Calculator,
  Zap,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getStudyNotes, saveStudyNote, deleteStudyNote } from "@/lib/api";
import type { StudyNote } from "@/lib/types";

interface StudyNotesWindowProps {
  open: boolean;
  onClose: () => void;
  userId: string | number;
  subject?: string;
  pos?: { x: number; y: number };
  onPosChange?: (pos: { x: number; y: number }) => void;
}

const CATEGORIES = [
  { id: "all", label: "All Notes", icon: FileText },
  { id: "ideas", label: "Ideas", icon: Lightbulb },
  { id: "study", label: "Study & Concepts", icon: BookOpen },
  { id: "formulas", label: "Formulas", icon: Calculator },
  { id: "quick", label: "Quick Memos", icon: Zap },
];

export function StudyNotesWindow({
  open,
  onClose,
  userId,
  subject = "General Study",
  pos = { x: 340, y: 80 },
  onPosChange,
}: StudyNotesWindowProps) {
  const [notes, setNotes] = useState<StudyNote[]>(() => {
    try {
      const saved = localStorage.getItem(`study_notes_${userId}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: "default-note-1",
        title: "Welcome to Study Notes & Ideas",
        content:
          "This is your persistent notes repository. You can write study summaries, formulas, and ideas here.\n\nYou can also tell JARVIS:\n• \"Take a note: review binary search trees\"\n• \"Save idea: build an AI agent for physics simulations\"\nJARVIS will record it here automatically.",
        category: "ideas",
        tags: ["getting-started", "jarvis"],
        is_pinned: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  });

  const [activeNoteId, setActiveNoteId] = useState<string>(notes[0]?.id || "");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Movable Window State
  const [windowPos, setWindowPos] = useState(pos);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 });

  useEffect(() => {
    setWindowPos(pos);
  }, [pos.x, pos.y]);

  // Load notes from MongoDB
  const fetchNotes = async () => {
    try {
      const serverNotes = await getStudyNotes(userId);
      if (Array.isArray(serverNotes) && serverNotes.length > 0) {
        setNotes(serverNotes);
        if (!activeNoteId && serverNotes[0]) {
          setActiveNoteId(serverNotes[0].id);
        }
      }
    } catch (e) {
      console.warn("Could not fetch remote notes, using local cache:", e);
    }
  };

  useEffect(() => {
    if (open) {
      fetchNotes();
    }
  }, [open, userId]);

  // Save notes locally whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(`study_notes_${userId}`, JSON.stringify(notes));
    } catch {}
  }, [notes, userId]);

  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === activeNoteId) || notes[0] || null;
  }, [notes, activeNoteId]);

  // Filter notes
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchCat = activeCategory === "all" || n.category === activeCategory;
      const s = searchQuery.toLowerCase().trim();
      const matchSearch =
        !s ||
        n.title.toLowerCase().includes(s) ||
        n.content.toLowerCase().includes(s) ||
        n.tags?.some((t) => t.toLowerCase().includes(s));
      return matchCat && matchSearch;
    });
  }, [notes, activeCategory, searchQuery]);

  // Create new Note
  const handleCreateNote = async (category: "ideas" | "study" | "formulas" | "quick" = "ideas") => {
    const newNote: StudyNote = {
      id: `note-${Date.now()}`,
      title: "Untitled Note",
      content: "",
      category,
      tags: [subject.toLowerCase()],
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);

    try {
      const saved = await saveStudyNote(userId, newNote);
      if (saved && saved.id) {
        setNotes((prev) =>
          prev.map((n) => (n.id === newNote.id ? { ...n, id: saved.id } : n))
        );
        setActiveNoteId(saved.id);
      }
    } catch (err) {
      console.warn("Failed to sync new note immediately:", err);
    }
  };

  // Update active note field
  const handleUpdateNote = async (patch: Partial<StudyNote>) => {
    if (!activeNote) return;
    const updated = {
      ...activeNote,
      ...patch,
      updated_at: new Date().toISOString(),
    };

    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));

    // Debounced or background save to MongoDB
    setIsSaving(true);
    try {
      await saveStudyNote(userId, updated);
    } catch (err) {
      console.warn("Failed to sync note update to MongoDB:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete note
  const handleDeleteNote = async (noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    if (activeNoteId === noteId) {
      const remaining = notes.filter((n) => n.id !== noteId);
      setActiveNoteId(remaining[0]?.id || "");
    }

    try {
      await deleteStudyNote(userId, noteId);
      toast.success("Note deleted");
    } catch (err) {
      console.warn("Delete note sync warning:", err);
    }
  };

  // Add Tag
  const handleAddTag = () => {
    if (!tagInput.trim() || !activeNote) return;
    const cleanTag = tagInput.trim().toLowerCase().replace(/^#/, "");
    if (!activeNote.tags?.includes(cleanTag)) {
      const newTags = [...(activeNote.tags || []), cleanTag];
      handleUpdateNote({ tags: newTags });
    }
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!activeNote) return;
    const newTags = (activeNote.tags || []).filter((t) => t !== tagToRemove);
    handleUpdateNote({ tags: newTags });
  };

  // Copy Content
  const handleCopy = () => {
    if (!activeNote) return;
    const fullText = `${activeNote.title}\n\n${activeNote.content}`;
    try {
      navigator.clipboard.writeText(fullText);
      setCopied(true);
      toast.success("Note copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  // Dragging Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, input, textarea, a, select")) return;
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: windowPos.x,
      posY: windowPos.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      const newX = Math.max(10, Math.min(window.innerWidth - 650, dragStartRef.current.posX + dx));
      const newY = Math.max(40, Math.min(window.innerHeight - 300, dragStartRef.current.posY + dy));
      const nextPos = { x: newX, y: newY };
      setWindowPos(nextPos);
      onPosChange?.(nextPos);
    };

    const handleMouseUp = () => {
      if (isDragging) setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, onPosChange]);

  if (!open) return null;

  return (
    <div
      style={{ left: `${windowPos.x}px`, top: `${windowPos.y}px` }}
      className="fixed z-40 w-[780px] max-w-[95vw] h-[540px] max-h-[85vh] select-none rounded-2xl border border-white/15 bg-zinc-950/95 backdrop-blur-2xl shadow-2xl shadow-black/80 text-white overflow-hidden flex flex-col font-sans"
    >
      {/* 1. Header Bar */}
      <div
        onMouseDown={handleMouseDown}
        className="flex items-center justify-between px-3.5 py-2.5 bg-zinc-900/90 border-b border-white/10 cursor-move"
      >
        {/* macOS Traffic Lights */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onClose}
            className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 border border-red-600/60 flex items-center justify-center transition-transform active:scale-90"
            title="Close Notes"
          >
            <X className="w-2 h-2 text-black/80 opacity-0 hover:opacity-100 transition-opacity" />
          </button>
          <button
            type="button"
            onClick={() => handleCreateNote()}
            className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 border border-yellow-600/60 flex items-center justify-center transition-transform active:scale-90"
            title="New Note"
          >
            <Plus className="w-2 h-2 text-black/80 opacity-0 hover:opacity-100 transition-opacity" />
          </button>
          <button
            type="button"
            className="w-3 h-3 rounded-full bg-emerald-500/80 hover:bg-emerald-500 border border-emerald-600/60 flex items-center justify-center transition-transform active:scale-90"
            title="Synced to MongoDB"
          >
            <Check className="w-2 h-2 text-black/80 opacity-0 hover:opacity-100 transition-opacity" />
          </button>
        </div>

        {/* Title */}
        <div className="flex items-center gap-2 text-xs font-semibold text-white/90">
          <FileText className="h-3.5 w-3.5 text-amber-400" />
          <span>Study Notes & Ideas</span>
          <Badge variant="outline" className="text-[9px] py-0 px-1 border-amber-500/40 text-amber-300">
            MongoDB Synced
          </Badge>
          {isSaving && <span className="text-[10px] text-white/40 animate-pulse">Saving...</span>}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleCreateNote()}
            className="h-6 px-2 text-[11px] text-amber-300 hover:text-white hover:bg-amber-500/20 rounded-md font-medium gap-1"
          >
            <Plus className="h-3 w-3" />
            <span>New Note</span>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="h-6 w-6 text-white/60 hover:text-white hover:bg-white/10 rounded-md"
            title="Close"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* 2. Main Content (Sidebar + Editor) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Notes List Sidebar */}
        <div className="w-[260px] bg-zinc-950/80 border-r border-white/10 flex flex-col p-2.5 space-y-2 select-text">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-white/40" />
            <Input
              type="text"
              placeholder="Search notes, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs bg-zinc-900 border-white/10 text-white focus-visible:ring-amber-500/40"
            />
          </div>

          {/* Categories */}
          <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar text-[10px]">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2 py-1 rounded-md whitespace-nowrap transition-all font-medium flex items-center gap-1 ${
                  activeCategory === cat.id
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <cat.icon className="h-2.5 w-2.5" />
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Notes List */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {filteredNotes.length === 0 ? (
              <div className="py-8 text-center text-xs text-white/40 space-y-1">
                <p>No notes found</p>
                <button
                  type="button"
                  onClick={() => handleCreateNote()}
                  className="text-amber-400 hover:underline text-[11px]"
                >
                  Create one now
                </button>
              </div>
            ) : (
              filteredNotes.map((note) => {
                const isActive = note.id === activeNote?.id;
                return (
                  <div
                    key={note.id}
                    onClick={() => setActiveNoteId(note.id)}
                    className={`p-2.5 rounded-xl cursor-pointer transition-all border text-left group relative ${
                      isActive
                        ? "bg-amber-500/15 border-amber-500/40 text-white shadow-sm"
                        : "bg-zinc-900/50 hover:bg-zinc-900 border-white/5 text-white/80 hover:text-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <h4 className="font-semibold text-xs truncate max-w-[170px]">
                        {note.title || "Untitled Note"}
                      </h4>
                      {note.is_pinned && <Pin className="h-3 w-3 text-amber-400 fill-amber-400 flex-shrink-0" />}
                    </div>
                    <p className="text-[11px] text-white/50 line-clamp-2 leading-relaxed">
                      {note.content || "Empty note"}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5 text-[9px] text-white/40">
                      <span>{new Date(note.updated_at).toLocaleDateString()}</span>
                      <span className="capitalize px-1 rounded bg-white/5 text-white/60">{note.category}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Note Editor Pane */}
        {activeNote ? (
          <div className="flex-1 flex flex-col bg-zinc-950 p-4 space-y-3 overflow-y-auto select-text">
            {/* Top Editor Controls */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <select
                  value={activeNote.category}
                  onChange={(e) =>
                    handleUpdateNote({
                      category: e.target.value as "ideas" | "study" | "formulas" | "quick",
                    })
                  }
                  className="bg-zinc-900 border border-white/15 rounded-md px-2 py-1 text-xs text-amber-300 font-medium focus:outline-none"
                >
                  <option value="ideas">💡 Ideas</option>
                  <option value="study">📖 Study & Concepts</option>
                  <option value="formulas">📐 Formulas</option>
                  <option value="quick">⚡ Quick Memo</option>
                </select>

                <button
                  type="button"
                  onClick={() => handleUpdateNote({ is_pinned: !activeNote.is_pinned })}
                  className={`p-1 rounded-md transition-colors ${
                    activeNote.is_pinned ? "text-amber-400 bg-amber-400/10" : "text-white/40 hover:text-white"
                  }`}
                  title={activeNote.is_pinned ? "Unpin Note" : "Pin Note to Top"}
                >
                  <Pin className={`h-3.5 w-3.5 ${activeNote.is_pinned ? "fill-amber-400" : ""}`} />
                </button>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopy}
                  className="h-7 px-2 text-[11px] text-white/70 hover:text-white hover:bg-white/10 gap-1"
                  title="Copy note"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteNote(activeNote.id)}
                  className="h-7 px-2 text-[11px] text-red-400 hover:text-red-300 hover:bg-red-500/20 gap-1"
                  title="Delete Note"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Delete</span>
                </Button>
              </div>
            </div>

            {/* Editable Title */}
            <input
              type="text"
              value={activeNote.title}
              onChange={(e) => handleUpdateNote({ title: e.target.value })}
              placeholder="Note Title..."
              className="w-full bg-transparent text-lg font-bold text-white placeholder-white/30 border-none outline-none focus:ring-0 px-0"
            />

            {/* Tags Bar */}
            <div className="flex items-center flex-wrap gap-1.5 py-1">
              {(activeNote.tags || []).map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-white/80 border border-white/10"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-red-400 ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="+ tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="h-5 w-16 bg-transparent text-[10px] text-white/60 placeholder-white/30 border-b border-white/20 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Note Content Textarea */}
            <Textarea
              rows={12}
              value={activeNote.content}
              onChange={(e) => handleUpdateNote({ content: e.target.value })}
              placeholder="Write your study notes, formulas, or let JARVIS take notes by voice..."
              className="flex-1 bg-zinc-900/40 border-white/10 text-xs text-white/90 leading-relaxed resize-none focus-visible:ring-amber-500/30 p-3 rounded-xl font-mono"
            />

            {/* Footer Metadata */}
            <div className="flex items-center justify-between text-[10px] text-white/40 pt-1">
              <span>
                Created: {new Date(activeNote.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ·{" "}
                {new Date(activeNote.created_at).toLocaleDateString()}
              </span>
              <span>{activeNote.content.split(/\s+/).filter(Boolean).length} words</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-white/40 space-y-2">
            <FileText className="h-8 w-8 text-white/20" />
            <p className="text-xs">Select a note or create a new one to start writing</p>
            <Button
              size="sm"
              onClick={() => handleCreateNote()}
              className="bg-amber-600 hover:bg-amber-500 text-white text-xs gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Note</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
