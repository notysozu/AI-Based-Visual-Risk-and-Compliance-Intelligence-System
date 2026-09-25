import { useState, useEffect, useRef } from "react";
import {
  Youtube,
  Play,
  Search,
  ExternalLink,
  Volume2,
  VolumeX,
  Sparkles,
  Maximize2,
  Minimize2,
  Bookmark,
  Trash2,
  Plus,
  Radio,
  Music,
  Headphones,
  Move,
  X,
  Check,
  Film
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export interface YouTubePreset {
  id: string;
  title: string;
  category: "lofi" | "ambient" | "classical" | "synthwave" | "noise";
  videoId: string;
  isLive?: boolean;
  tag: string;
  thumbnail: string;
}

export const CURATED_YOUTUBE_PRESETS: YouTubePreset[] = [
  {
    id: "lofi-girl-live",
    title: "Lofi Girl — beats to relax/study to",
    category: "lofi",
    videoId: "jfKfPfyJRdk",
    isLive: true,
    tag: "24/7 Lofi Stream",
    thumbnail: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=300&auto=format&fit=crop",
  },
  {
    id: "synthwave-boy-live",
    title: "Synthwave Radio — Chill synth & retro beats",
    category: "synthwave",
    videoId: "4xDzrJKXOOY",
    isLive: true,
    tag: "Synthwave Focus",
    thumbnail: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=300&auto=format&fit=crop",
  },
  {
    id: "deep-focus-ambient",
    title: "Deep Ambient Rain & Thunderstorm for Focus",
    category: "ambient",
    videoId: "mPZkdNFkNps",
    tag: "Rain & Thunder",
    thumbnail: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=300&auto=format&fit=crop",
  },
  {
    id: "mozart-classical-study",
    title: "Mozart & Classical Piano for Brainpower",
    category: "classical",
    videoId: "Rb0UmrCXxVA",
    tag: "Classical Piano",
    thumbnail: "https://images.unsplash.com/photo-1520523839898-507127053c37?q=80&w=300&auto=format&fit=crop",
  },
  {
    id: "coffee-shop-jazz",
    title: "Tokyo Coffee Shop Ambience & Gentle Jazz",
    category: "lofi",
    videoId: "5qap5aO4i9A",
    tag: "Coffee Shop Jazz",
    thumbnail: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=300&auto=format&fit=crop",
  },
  {
    id: "binaural-alpha-waves",
    title: "Alpha Waves 432Hz — Memory & Super Focus",
    category: "noise",
    videoId: "WPni755-Krg",
    tag: "Binaural Beats",
    thumbnail: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=300&auto=format&fit=crop",
  },
  {
    id: "brown-noise-adhd",
    title: "Pure Brown Noise for ADHD & Deep Work",
    category: "noise",
    videoId: "RqzGzwTY-6w",
    tag: "Brown Noise ADHD",
    thumbnail: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=300&auto=format&fit=crop",
  },
  {
    id: "cyberpunk-coding-beats",
    title: "Hacker / Cyberpunk Beats for High Stamina",
    category: "synthwave",
    videoId: "f02mOEt11OQ",
    tag: "Cyberpunk Focus",
    thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=300&auto=format&fit=crop",
  },
];

export function extractYouTubeVideoId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // Direct video ID (11 chars)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // youtube.com/watch?v=VIDEO_ID
  const vMatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (vMatch && vMatch[1]) {
    return vMatch[1];
  }

  // youtube.com/live/VIDEO_ID
  const liveMatch = trimmed.match(/youtube\.com\/live\/([^"&?\/\s]{11})/i);
  if (liveMatch && liveMatch[1]) {
    return liveMatch[1];
  }

  return null;
}

interface StudyYouTubePlayerProps {
  open: boolean;
  onClose: () => void;
  pos?: { x: number; y: number };
  onPosChange?: (pos: { x: number; y: number }) => void;
  zIndex?: number;
  onFocus?: () => void;
}

export function StudyYouTubePlayer({
  open,
  onClose,
  pos = { x: 30, y: 70 },
  onPosChange,
  zIndex = 40,
  onFocus,
}: StudyYouTubePlayerProps) {
  const [activePreset, setActivePreset] = useState<YouTubePreset>(CURATED_YOUTUBE_PRESETS[0]);
  const [customInput, setCustomInput] = useState("");
  const [savedFavorites, setSavedFavorites] = useState<YouTubePreset[]>(() => {
    try {
      const saved = localStorage.getItem("study_youtube_favorites");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [activeTab, setActiveTab] = useState<"curated" | "favorites" | "custom">("curated");
  const [isCompact, setIsCompact] = useState(false);

  // Movable & Resizable Window State
  const [windowPos, setWindowPos] = useState(pos);
  const [windowSize, setWindowSize] = useState<{ width: number; height: number }>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("study_youtube_window_size");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (typeof parsed.width === "number" && typeof parsed.height === "number") {
            return {
              width: Math.max(340, Math.min(window.innerWidth - 30, parsed.width)),
              height: Math.max(260, Math.min(window.innerHeight - 60, parsed.height)),
            };
          }
        } catch {}
      }
    }
    return { width: 480, height: 540 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 });

  const [isCornerResizing, setIsCornerResizing] = useState(false);
  const cornerResizeStartRef = useRef({ mouseX: 0, mouseY: 0, startW: 0, startH: 0 });

  useEffect(() => {
    setWindowPos(pos);
  }, [pos.x, pos.y]);

  useEffect(() => {
    try {
      localStorage.setItem("study_youtube_favorites", JSON.stringify(savedFavorites));
    } catch {}
  }, [savedFavorites]);

  const handleSelectPreset = (preset: YouTubePreset) => {
    setActivePreset(preset);
  };

  const handleLoadCustom = () => {
    const vid = extractYouTubeVideoId(customInput);
    if (!vid) {
      toast.error("Invalid YouTube link or Video ID");
      return;
    }

    const newPreset: YouTubePreset = {
      id: `custom-${Date.now()}`,
      title: "Custom YouTube Stream",
      category: "lofi",
      videoId: vid,
      tag: "Custom Stream",
      thumbnail: `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
    };

    setActivePreset(newPreset);
    toast.success("Loaded YouTube video stream");
  };

  const handleSaveFavorite = (preset: YouTubePreset) => {
    if (savedFavorites.some((f) => f.videoId === preset.videoId)) {
      toast.info("Already saved in favorites");
      return;
    }
    setSavedFavorites((prev) => [...prev, preset]);
    toast.success(`Saved "${preset.title}" to favorites`);
  };

  const handleRemoveFavorite = (id: string) => {
    setSavedFavorites((prev) => prev.filter((f) => f.id !== id));
    toast.success("Removed from favorites");
  };

  // Dragging Handlers
  const currentPosRef = useRef(windowPos);
  currentPosRef.current = windowPos;

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, input, iframe, a")) return;
    onFocus?.();
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
      const maxX = Math.max(10, window.innerWidth - (isCompact ? 320 : windowSize.width) - 10);
      const maxY = Math.max(40, window.innerHeight - 100);
      const newX = Math.max(10, Math.min(maxX, dragStartRef.current.posX + dx));
      const newY = Math.max(40, Math.min(maxY, dragStartRef.current.posY + dy));
      const nextPos = { x: newX, y: newY };
      currentPosRef.current = nextPos;
      setWindowPos(nextPos);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        onPosChange?.(currentPosRef.current);
      }
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, onPosChange, isCompact, windowSize.width]);

  // Corner Resize Handlers
  const handleCornerResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFocus?.();
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
    let finalSize = windowSize;

    const onMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - cornerResizeStartRef.current.mouseX;
      const deltaY = e.clientY - cornerResizeStartRef.current.mouseY;
      const maxW = Math.min(window.innerWidth - windowPos.x - 16, window.innerWidth - 32);
      const maxH = Math.min(window.innerHeight - windowPos.y - 16, window.innerHeight - 60);
      const nextW = Math.max(340, Math.min(maxW, cornerResizeStartRef.current.startW + deltaX));
      const nextH = Math.max(260, Math.min(maxH, cornerResizeStartRef.current.startH + deltaY));
      finalSize = { width: nextW, height: nextH };
      setWindowSize(finalSize);
    };

    const onMouseUp = () => {
      setIsCornerResizing(false);
      try {
        localStorage.setItem("study_youtube_window_size", JSON.stringify(finalSize));
      } catch {}
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isCornerResizing, windowPos.x, windowPos.y, windowSize]);

  if (!open) return null;

  return (
    <div
      onMouseDownCapture={onFocus}
      style={{
        left: `${windowPos.x}px`,
        top: `${windowPos.y}px`,
        width: isCompact ? "340px" : `${windowSize.width}px`,
        height: isCompact ? undefined : `${windowSize.height}px`,
        zIndex,
      }}
      className={`fixed max-w-[98vw] max-h-[92vh] select-none rounded-2xl border border-white/10 bg-[#0F0F0F]/95 backdrop-blur-2xl shadow-2xl shadow-black/90 text-white overflow-hidden flex flex-col font-sans transition-shadow ${
        isCompact ? "h-auto" : ""
      }`}
    >
      {/* 1. YouTube Authentic Header Bar */}
      <div
        onMouseDown={handleMouseDown}
        className="flex items-center justify-between px-3.5 py-2.5 bg-[#000000]/90 border-b border-white/5 cursor-move"
      >
        {/* macOS Traffic Lights */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onClose}
            className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 border border-red-600/60 flex items-center justify-center transition-transform active:scale-90"
            title="Close"
          >
            <X className="w-2 h-2 text-black/80 opacity-0 hover:opacity-100 transition-opacity" />
          </button>
          <button
            type="button"
            onClick={() => setIsCompact(!isCompact)}
            className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 border border-yellow-600/60 flex items-center justify-center transition-transform active:scale-90"
            title={isCompact ? "Expand Player" : "Mini-Player Mode"}
          >
            {isCompact ? (
              <Maximize2 className="w-2 h-2 text-black/80 opacity-0 hover:opacity-100 transition-opacity" />
            ) : (
              <Minimize2 className="w-2 h-2 text-black/80 opacity-0 hover:opacity-100 transition-opacity" />
            )}
          </button>
          <a
            href={`https://www.youtube.com/watch?v=${activePreset.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-3 h-3 rounded-full bg-emerald-500/80 hover:bg-emerald-500 border border-emerald-600/60 flex items-center justify-center transition-transform active:scale-90"
            title="Open in YouTube"
          >
            <ExternalLink className="w-2 h-2 text-black/80 opacity-0 hover:opacity-100 transition-opacity" />
          </a>
        </div>

        {/* Brand Header */}
        <div className="flex items-center gap-2 text-xs font-bold text-white tracking-wide">
          <div className="px-1.5 py-0.5 rounded bg-[#FF0000] text-white flex items-center justify-center">
            <Youtube className="h-3 w-3 fill-white" />
          </div>
          <span>YouTube Focus</span>
          {activePreset.isLive && (
            <span className="flex items-center gap-1 text-[9px] text-white font-bold bg-[#FF0000] px-1.5 py-0.2 rounded uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              Live
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleSaveFavorite(activePreset)}
            className="h-6 w-6 text-white/60 hover:text-[#FF0000] hover:bg-white/5 rounded-md"
            title="Bookmark Stream"
          >
            <Bookmark className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="h-6 w-6 text-white/60 hover:text-white hover:bg-white/5 rounded-md"
            title="Close"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* 2. Embedded Video Frame */}
      <div className="p-3 bg-[#0F0F0F]">
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-white/10 shadow-lg">
          {(isDragging || isCornerResizing) && <div className="absolute inset-0 z-50 bg-transparent" />}
          <iframe
            key={activePreset.videoId}
            src={`https://www.youtube.com/embed/${activePreset.videoId}?autoplay=1&mute=0&controls=1&modestbranding=1&rel=0`}
            title={activePreset.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>
      </div>

      {/* 3. Navigation Tabs & Channel Selector */}
      {!isCompact && (
        <div className="p-3 pt-0 space-y-2.5 text-xs">
          {/* YouTube Style Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#212121] border border-white/5">
            <button
              type="button"
              onClick={() => setActiveTab("curated")}
              className={`flex-1 py-1 px-2.5 rounded-full text-[11px] font-semibold transition-all ${
                activeTab === "curated"
                  ? "bg-white text-black shadow-sm"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Featured Streams
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("favorites")}
              className={`flex-1 py-1 px-2.5 rounded-full text-[11px] font-semibold transition-all flex items-center justify-center gap-1 ${
                activeTab === "favorites"
                  ? "bg-white text-black shadow-sm"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <span>Library</span>
              {savedFavorites.length > 0 && (
                <span className="w-3.5 h-3.5 rounded-full bg-[#FF0000] text-white text-[9px] font-bold flex items-center justify-center">
                  {savedFavorites.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("custom")}
              className={`flex-1 py-1 px-2.5 rounded-full text-[11px] font-semibold transition-all ${
                activeTab === "custom"
                  ? "bg-white text-black shadow-sm"
                  : "text-white/70 hover:text-white"
              }`}
            >
              URL / Search
            </button>
          </div>

          {/* TAB 1: CURATED STREAMS */}
          {activeTab === "curated" && (
            <div className="grid grid-cols-2 gap-2 max-h-[190px] overflow-y-auto pr-1 custom-scrollbar">
              {CURATED_YOUTUBE_PRESETS.map((preset) => {
                const isSelected = activePreset.id === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-2 rounded-xl cursor-pointer transition-all border text-left group relative flex items-center gap-2 ${
                      isSelected
                        ? "bg-[#282828] border-[#FF0000]/60 text-white shadow-md"
                        : "bg-[#1F1F1F] hover:bg-[#2A2A2A] border-white/5 text-white/80 hover:text-white"
                    }`}
                  >
                    <div className="relative w-12 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-black">
                      <img
                        src={preset.thumbnail}
                        alt={preset.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="h-3.5 w-3.5 text-white fill-white" />
                      </div>
                      {preset.isLive && (
                        <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-[#FF0000] text-white text-[7px] font-bold uppercase">
                          Live
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-semibold text-xs truncate">{preset.title}</h5>
                      <p className="text-[10px] text-white/50 truncate">{preset.tag}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: SAVED FAVORITES */}
          {activeTab === "favorites" && (
            <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1 custom-scrollbar">
              {savedFavorites.length === 0 ? (
                <div className="text-center py-6 text-white/40 text-xs space-y-1">
                  <Bookmark className="h-6 w-6 mx-auto opacity-30 text-[#FF0000]" />
                  <p>No saved YouTube streams yet.</p>
                  <p className="text-[10px] text-white/30">Bookmark videos for quick access during study</p>
                </div>
              ) : (
                savedFavorites.map((fav) => (
                  <div
                    key={fav.id}
                    onClick={() => handleSelectPreset(fav)}
                    className="flex items-center justify-between p-2 rounded-xl bg-[#1F1F1F] hover:bg-[#2A2A2A] border border-white/5 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-7 rounded bg-black overflow-hidden flex-shrink-0">
                        <img
                          src={fav.thumbnail}
                          alt={fav.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="truncate">
                        <p className="font-semibold text-xs text-white truncate">{fav.title}</p>
                        <p className="text-[10px] text-white/50 truncate">{fav.tag}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFavorite(fav.id);
                      }}
                      className="p-1.5 text-white/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: CUSTOM URL PARSER */}
          {activeTab === "custom" && (
            <div className="space-y-2 p-2.5 rounded-xl bg-[#1F1F1F] border border-white/5">
              <p className="text-[10px] text-white/60">
                Paste any YouTube video or live stream URL:
              </p>
              <div className="flex items-center gap-1.5">
                <Input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleLoadCustom();
                  }}
                  className="h-8 bg-[#0F0F0F] border-white/10 text-xs text-white placeholder-white/30"
                />
                <Button
                  size="sm"
                  onClick={handleLoadCustom}
                  className="h-8 bg-[#FF0000] hover:bg-red-600 text-white font-bold text-xs px-3"
                >
                  Play
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom-Right macOS Corner Resize Handle */}
      {!isCompact && (
        <div
          onMouseDown={handleCornerResizeMouseDown}
          className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize flex items-center justify-center text-white/30 hover:text-white/80 transition-colors z-50 group"
          title="Drag to resize YouTube window"
        >
          <svg
            className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="21" y1="9" x2="9" y2="21" />
            <line x1="21" y1="15" x2="15" y2="21" />
          </svg>
        </div>
      )}
    </div>
  );
}
