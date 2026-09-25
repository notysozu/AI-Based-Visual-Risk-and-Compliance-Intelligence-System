import { useState, useEffect, useRef } from "react";
import {
  Globe,
  Search,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Home,
  ExternalLink,
  Plus,
  X,
  Bookmark,
  Sparkles,
  Maximize2,
  Minimize2,
  Move,
  Lock,
  Layers,
  Code2,
  Calculator,
  BookOpen,
  Brain,
  Pencil,
  FileText,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export interface StudyBookmark {
  id: string;
  name: string;
  url: string;
  category: "tools" | "reference" | "ai" | "custom";
  iconName: string;
  badge?: string;
}

export const CURATED_STUDY_BOOKMARKS: StudyBookmark[] = [
  {
    id: "gemini",
    name: "Google Gemini AI",
    url: "https://gemini.google.com",
    category: "ai",
    iconName: "Sparkles",
    badge: "Official Gemini",
  },
  {
    id: "excalidraw",
    name: "Excalidraw Whiteboard",
    url: "https://excalidraw.com",
    category: "tools",
    iconName: "Pencil",
    badge: "Interactive Canvas",
  },
  {
    id: "wikipedia",
    name: "Wikipedia Knowledge",
    url: "https://en.m.wikipedia.org",
    category: "reference",
    iconName: "BookOpen",
    badge: "Encyclopedia",
  },
  {
    id: "desmos",
    name: "Desmos Graphing Calc",
    url: "https://www.desmos.com/calculator",
    category: "tools",
    iconName: "Calculator",
    badge: "Math & Graphs",
  },
  {
    id: "devdocs",
    name: "DevDocs API Reference",
    url: "https://devdocs.io",
    category: "reference",
    iconName: "Code2",
    badge: "Coding Docs",
  },
  {
    id: "wolfram",
    name: "Wolfram|Alpha",
    url: "https://www.wolframalpha.com",
    category: "tools",
    iconName: "Brain",
    badge: "Computational Math",
  },
  {
    id: "arxiv",
    name: "arXiv Academic Papers",
    url: "https://arxiv.org",
    category: "reference",
    iconName: "FileText",
    badge: "Scientific Research",
  },
];

interface BrowserTab {
  id: string;
  title: string;
  url: string;
}

interface StudyWebBrowserProps {
  open: boolean;
  onClose: () => void;
  pos?: { x: number; y: number };
  onPosChange?: (pos: { x: number; y: number }) => void;
}

export function StudyWebBrowser({
  open,
  onClose,
  pos = { x: 80, y: 70 },
  onPosChange,
}: StudyWebBrowserProps) {
  // Multi-tab state
  const [tabs, setTabs] = useState<BrowserTab[]>([
    {
      id: "tab-1",
      title: "Excalidraw",
      url: "https://excalidraw.com",
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>("tab-1");
  const [inputUrl, setInputUrl] = useState("https://excalidraw.com");
  const [searchEngine, setSearchEngine] = useState<"ddg" | "wiki" | "google">("ddg");

  // Custom User Bookmarks
  const [customBookmarks, setCustomBookmarks] = useState<StudyBookmark[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("study_browser_custom_bookmarks");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  // Movable & Resizable Window State
  const [windowPos, setWindowPos] = useState(pos);
  const [windowSize, setWindowSize] = useState<{ width: number; height: number }>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("study_browser_window_size");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return {
            width: Math.max(380, Math.min(window.innerWidth - 40, parsed.width)),
            height: Math.max(340, Math.min(window.innerHeight - 80, parsed.height)),
          };
        } catch {}
      }
    }
    return { width: 720, height: 560 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 });

  const [isCornerResizing, setIsCornerResizing] = useState(false);
  const cornerResizeStartRef = useRef({ mouseX: 0, mouseY: 0, startW: 0, startH: 0 });

  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    setWindowPos(pos);
  }, [pos.x, pos.y]);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  useEffect(() => {
    if (activeTab) {
      setInputUrl(activeTab.url);
    }
  }, [activeTabId, activeTab]);

  // Navigate to URL or Search Query
  const navigateTo = (target: string, tabId?: string) => {
    let resolvedUrl = target.trim();
    if (!resolvedUrl) return;

    // Check if it's a domain/URL
    const isUrl =
      resolvedUrl.startsWith("http://") ||
      resolvedUrl.startsWith("https://") ||
      /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/.*)?$/.test(resolvedUrl);

    if (isUrl) {
      if (!resolvedUrl.startsWith("http://") && !resolvedUrl.startsWith("https://")) {
        resolvedUrl = `https://${resolvedUrl}`;
      }
    } else {
      // It's a search term
      if (searchEngine === "wiki") {
        resolvedUrl = `https://en.m.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(resolvedUrl)}`;
      } else if (searchEngine === "google") {
        resolvedUrl = `https://www.google.com/search?q=${encodeURIComponent(resolvedUrl)}&igu=1`;
      } else {
        resolvedUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(resolvedUrl)}`;
      }
    }

    const currentTId = tabId || activeTabId;
    let newTitle = "Web";
    try {
      const u = new URL(resolvedUrl);
      newTitle = u.hostname.replace("www.", "").replace(".m.wikipedia.org", " Wikipedia");
    } catch {
      newTitle = resolvedUrl.slice(0, 15);
    }

    setTabs((prev) =>
      prev.map((t) => (t.id === currentTId ? { ...t, url: resolvedUrl, title: newTitle } : t))
    );
    setInputUrl(resolvedUrl);
    setIframeKey((k) => k + 1);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateTo(inputUrl);
  };

  const handleNewTab = () => {
    const newTabId = `tab-${Date.now()}`;
    const newTab: BrowserTab = {
      id: newTabId,
      title: "Wikipedia",
      url: "https://en.m.wikipedia.org",
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTabId);
    setInputUrl("https://en.m.wikipedia.org");
  };

  const handleCloseTab = (tId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) {
      onClose();
      return;
    }
    const remaining = tabs.filter((t) => t.id !== tId);
    setTabs(remaining);
    if (activeTabId === tId) {
      setActiveTabId(remaining[0].id);
    }
  };

  const handleAddBookmark = () => {
    if (!activeTab?.url) return;
    if (
      CURATED_STUDY_BOOKMARKS.some((b) => b.url === activeTab.url) ||
      customBookmarks.some((b) => b.url === activeTab.url)
    ) {
      toast.info("Bookmark already saved");
      return;
    }
    const newBm: StudyBookmark = {
      id: `bm-${Date.now()}`,
      name: activeTab.title || "Custom Link",
      url: activeTab.url,
      category: "custom",
      iconName: "Bookmark",
    };
    const updated = [newBm, ...customBookmarks];
    setCustomBookmarks(updated);
    try {
      localStorage.setItem("study_browser_custom_bookmarks", JSON.stringify(updated));
    } catch {}
    toast.success("Saved bookmark to study browser");
  };

  // Drag-to-Move
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, input, select, iframe, a")) return;
    e.preventDefault();
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: windowPos.x,
      posY: windowPos.y,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartRef.current.mouseX;
      const deltaY = e.clientY - dragStartRef.current.mouseY;
      const nextX = Math.max(8, Math.min(window.innerWidth - 300, dragStartRef.current.posX + deltaX));
      const nextY = Math.max(52, Math.min(window.innerHeight - 150, dragStartRef.current.posY + deltaY));
      const newPos = { x: nextX, y: nextY };
      setWindowPos(newPos);
      if (onPosChange) onPosChange(newPos);
    };
    const onMouseUp = () => setIsDragging(false);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging, onPosChange]);

  // Corner Resize
  const handleCornerResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    cornerResizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startW: windowSize.width,
      startH: windowSize.height,
    };
    setIsCornerResizing(true);
  };

  useEffect(() => {
    if (!isCornerResizing) return;
    const onMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - cornerResizeStartRef.current.mouseX;
      const deltaY = e.clientY - cornerResizeStartRef.current.mouseY;
      const maxW = Math.min(window.innerWidth - windowPos.x - 16, window.innerWidth - 32);
      const maxH = Math.min(window.innerHeight - windowPos.y - 16, window.innerHeight - 60);
      const nextW = Math.max(380, Math.min(maxW, cornerResizeStartRef.current.startW + deltaX));
      const nextH = Math.max(300, Math.min(maxH, cornerResizeStartRef.current.startH + deltaY));
      const newSize = { width: nextW, height: nextH };
      setWindowSize(newSize);
      try {
        localStorage.setItem("study_browser_window_size", JSON.stringify(newSize));
      } catch {}
    };
    const onMouseUp = () => setIsCornerResizing(false);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isCornerResizing, windowPos.x, windowPos.y]);

  if (!open) return null;

  return (
    <div
      style={{
        left: isMaximized ? "12px" : `${windowPos.x}px`,
        top: isMaximized ? "52px" : `${windowPos.y}px`,
        width: isMaximized ? "calc(100vw - 24px)" : `${windowSize.width}px`,
        height: isMaximized ? "calc(100vh - 64px)" : `${windowSize.height}px`,
      }}
      className="fixed z-30 rounded-2xl border border-cyan-500/25 bg-black/40 backdrop-blur-2xl shadow-2xl flex flex-col overflow-hidden select-none transition-all duration-150"
    >
      {/* 1. macOS Window Header & Tab Bar */}
      <div
        onMouseDown={handleMouseDown}
        className="cursor-grab active:cursor-grabbing flex items-center justify-between px-3 py-1.5 border-b border-white/10 bg-gradient-to-r from-cyan-950/40 via-black/40 to-black/40 group"
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* Green minimize dot */}
          <button
            type="button"
            onClick={onClose}
            className="w-3 h-3 rounded-full bg-emerald-500 hover:bg-emerald-400 transition-colors shadow-sm flex items-center justify-center group"
            title="Hide Browser"
          >
            <span className="opacity-0 group-hover:opacity-100 text-[8px] text-black font-bold">−</span>
          </button>

          {/* Browser Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar max-w-[340px] sm:max-w-[480px]">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                  activeTabId === tab.id
                    ? "bg-white/15 text-white shadow-sm border border-white/15"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Globe className="h-3 w-3 text-cyan-400 shrink-0" />
                <span className="truncate max-w-[100px]">{tab.title}</span>
                <button
                  type="button"
                  onClick={(e) => handleCloseTab(tab.id, e)}
                  className="text-white/40 hover:text-red-400 p-0.5 rounded"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={handleNewTab}
              className="p-1 text-white/50 hover:text-white hover:bg-white/10 rounded-md"
              title="Open New Tab"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Window Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsMaximized(!isMaximized)}
            className="h-6 w-6 text-white/60 hover:text-white hover:bg-white/10"
            title={isMaximized ? "Restore Size" : "Maximize Window"}
          >
            {isMaximized ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="h-6 w-6 text-white/60 hover:text-red-400 hover:bg-white/10"
            title="Close Browser"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* 2. Omnibox Navigation & Address Bar */}
      <div className="p-2 border-b border-white/10 bg-black/30 flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
        {/* Navigation Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIframeKey((k) => k + 1)}
            className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
            title="Reload Page"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => navigateTo("https://excalidraw.com")}
            className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
            title="Home (Excalidraw Whiteboard)"
          >
            <Home className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Address & Omnibox Form */}
        <form onSubmit={handleFormSubmit} className="flex-1 flex items-center gap-1 min-w-0">
          <div className="relative flex-1 flex items-center">
            <Lock className="absolute left-2.5 h-3 w-3 text-cyan-400 pointer-events-none" />
            <Input
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Search or enter URL (e.g., wikipedia.org, excalidraw.com)..."
              className="h-7 pl-7 pr-3 bg-zinc-900/90 border-white/15 text-xs text-white placeholder:text-white/40 rounded-lg focus-visible:ring-1 focus-visible:ring-cyan-400"
            />
          </div>

          <Button
            type="submit"
            size="sm"
            className="h-7 px-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shrink-0"
          >
            Go
          </Button>
        </form>

        {/* Action icons */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleAddBookmark}
            className="h-7 px-2 text-[11px] text-white/70 hover:text-white hover:bg-white/10 rounded-md gap-1"
            title="Bookmark this page"
          >
            <Bookmark className="h-3 w-3 text-cyan-400" />
            <span className="hidden md:inline">Bookmark</span>
          </Button>

          <a
            href={activeTab?.url || "https://excalidraw.com"}
            target="_blank"
            rel="noreferrer"
            className="h-7 px-2 text-[11px] text-white/70 hover:text-white hover:bg-white/10 rounded-md flex items-center gap-1"
            title="Open in new browser window/tab"
          >
            <ExternalLink className="h-3 w-3" />
            <span className="hidden md:inline">Open Out</span>
          </a>
        </div>
      </div>

      {/* 3. Quick Study Bookmarks Bar */}
      <div className="px-2.5 py-1.5 border-b border-white/10 bg-black/20 flex items-center gap-1.5 overflow-x-auto custom-scrollbar text-[11px]">
        <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider shrink-0 mr-1">
          Quick Tools:
        </span>

        {CURATED_STUDY_BOOKMARKS.map((bm) => (
          <button
            key={bm.id}
            type="button"
            onClick={() => navigateTo(bm.url)}
            className={`px-2 py-0.5 rounded-md font-medium shrink-0 flex items-center gap-1 transition-all ${
              activeTab?.url === bm.url
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                : "bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/10"
            }`}
          >
            {bm.iconName === "Pencil" && <Pencil className="h-2.5 w-2.5 text-cyan-400" />}
            {bm.iconName === "BookOpen" && <BookOpen className="h-2.5 w-2.5 text-purple-400" />}
            {bm.iconName === "Calculator" && <Calculator className="h-2.5 w-2.5 text-emerald-400" />}
            {bm.iconName === "Code2" && <Code2 className="h-2.5 w-2.5 text-amber-400" />}
            {bm.iconName === "Brain" && <Brain className="h-2.5 w-2.5 text-indigo-400" />}
            {bm.iconName === "FileText" && <FileText className="h-2.5 w-2.5 text-rose-400" />}
            <span>{bm.name.split(" ")[0]}</span>
          </button>
        ))}

        {customBookmarks.map((bm) => (
          <button
            key={bm.id}
            type="button"
            onClick={() => navigateTo(bm.url)}
            className="px-2 py-0.5 rounded-md font-medium shrink-0 flex items-center gap-1 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/10"
          >
            <Bookmark className="h-2.5 w-2.5 text-cyan-400" />
            <span>{bm.name}</span>
          </button>
        ))}
      </div>

      {/* 4. Web Browser Viewport (Iframe Sandbox) */}
      <div className="flex-1 relative bg-white/5 overflow-hidden">
        <iframe
          key={`${activeTab?.url}-${iframeKey}`}
          src={activeTab?.url || "https://excalidraw.com"}
          title={activeTab?.title || "Study Browser"}
          className="w-full h-full border-0 bg-white"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads allow-modals"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        />

        {/* Small Floating Helper Ribbon for strict iframe CORS / X-Frame-Options */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-black/80 backdrop-blur-md border border-white/15 px-2.5 py-1 rounded-full text-[10px] text-white/70 shadow-lg">
          <span>Site blocked by iframe security?</span>
          <a
            href={activeTab?.url || "https://excalidraw.com"}
            target="_blank"
            rel="noreferrer"
            className="text-cyan-400 hover:underline font-semibold flex items-center gap-0.5"
          >
            <span>Open in Tab</span>
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      </div>

      {/* 5. Window Bottom Resize Grip Handle */}
      {!isMaximized && (
        <div
          onMouseDown={handleCornerResizeMouseDown}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-end justify-end p-0.5 text-white/30 hover:text-cyan-400"
          title="Drag corner to resize browser window"
        >
          <svg viewBox="0 0 6 6" className="w-2.5 h-2.5 fill-current">
            <circle cx="5" cy="5" r="0.8" />
            <circle cx="5" cy="2.5" r="0.8" />
            <circle cx="2.5" cy="5" r="0.8" />
          </svg>
        </div>
      )}
    </div>
  );
}
