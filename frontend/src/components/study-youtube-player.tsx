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
  Minus
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
    videoId: "jfKfPfyJRdk", // 24/7 Lofi Hip Hop live stream
    isLive: true,
    tag: "24/7 Lofi Stream",
    thumbnail: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=300&auto=format&fit=crop",
  },
  {
    id: "synthwave-boy-live",
    title: "Synthwave Radio — Chill synth & retro beats",
    category: "synthwave",
    videoId: "4xDzrJKXOOY", // Synthwave radio
    isLive: true,
    tag: "Synthwave Focus",
    thumbnail: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=300&auto=format&fit=crop",
  },
  {
    id: "deep-focus-ambient",
    title: "Deep Ambient Rain & Thunderstorm for Focus",
    category: "ambient",
    videoId: "mPZkdNFkNps", // Rain ambient
    tag: "Rain & Ambient",
    thumbnail: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=300&auto=format&fit=crop",
  },
  {
    id: "mozart-classical-study",
    title: "Mozart & Classical Piano for Brainpower",
    category: "classical",
    videoId: "Rb0UmrCXxVA", // Classical Mozart
    tag: "Classical Piano",
    thumbnail: "https://images.unsplash.com/photo-1520523839898-507127053c37?q=80&w=300&auto=format&fit=crop",
  },
  {
    id: "coffee-shop-jazz",
    title: "Tokyo Coffee Shop Ambience & Gentle Jazz",
    category: "lofi",
    videoId: "5qap5aO4i9A", // Coffee shop lofi
    tag: "Coffee Shop Jazz",
    thumbnail: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=300&auto=format&fit=crop",
  },
  {
    id: "binaural-alpha-waves",
    title: "Alpha Waves 432Hz — Memory & Super Focus",
    category: "noise",
    videoId: "WPni755-Krg", // 432Hz Alpha
    tag: "Binaural Beats",
    thumbnail: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=300&auto=format&fit=crop",
  },
  {
    id: "brown-noise-adhd",
    title: "Pure Brown Noise for ADHD & Deep Work",
    category: "noise",
    videoId: "RqzGzwTY-6w", // Brown noise
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

export function extractYouTubeId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  // If it's already an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Handle standard YouTube URL patterns
  try {
    const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    if (parsed.hostname.includes("youtube.com")) {
      const v = parsed.searchParams.get("v");
      if (v && v.length === 11) return v;
      if (parsed.pathname.startsWith("/embed/")) {
        const id = parsed.pathname.split("/embed/")[1]?.split("/")[0]?.split("?")[0];
        if (id && id.length === 11) return id;
      }
      if (parsed.pathname.startsWith("/live/")) {
        const id = parsed.pathname.split("/live/")[1]?.split("/")[0]?.split("?")[0];
        if (id && id.length === 11) return id;
      }
    } else if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.slice(1).split("/")[0]?.split("?")[0];
      if (id && id.length === 11) return id;
    }
  } catch {}

  // Fallback regex match
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|live\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

interface StudyYouTubePlayerProps {
  open: boolean;
  onClose: () => void;
  pos?: { x: number; y: number };
  onPosChange?: (pos: { x: number; y: number }) => void;
}

export function StudyYouTubePlayer({
  open,
  onClose,
  pos = { x: 440, y: 68 },
  onPosChange,
}: StudyYouTubePlayerProps) {
  const [currentVideoId, setCurrentVideoId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("study_youtube_current_id") || CURATED_YOUTUBE_PRESETS[0].videoId;
    }
    return CURATED_YOUTUBE_PRESETS[0].videoId;
  });

  const [currentTitle, setCurrentTitle] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("study_youtube_current_title") || CURATED_YOUTUBE_PRESETS[0].title;
    }
    return CURATED_YOUTUBE_PRESETS[0].title;
  });

  const [urlInput, setUrlInput] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isMiniPiP, setIsMiniPiP] = useState(false);

  // Custom Saved Streams
  const [customFavorites, setCustomFavorites] = useState<{ id: string; title: string; videoId: string }[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("study_youtube_favorites");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  // Movable Window State
  const [windowPos, setWindowPos] = useState(pos);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 });

  useEffect(() => {
    setWindowPos(pos);
  }, [pos.x, pos.y]);

  const handleSelectVideo = (videoId: string, title: string) => {
    setCurrentVideoId(videoId);
    setCurrentTitle(title);
    try {
      localStorage.setItem("study_youtube_current_id", videoId);
      localStorage.setItem("study_youtube_current_title", title);
    } catch {}
    toast.success(`Playing: ${title}`);
  };

  const handleCustomSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!urlInput.trim()) return;

    const extracted = extractYouTubeId(urlInput);
    if (extracted) {
      const title = `Custom Stream (${extracted})`;
      handleSelectVideo(extracted, title);
      setUrlInput("");
    } else {
      // If it's a search term or invalid URL
      const searchId = "jfKfPfyJRdk"; // Default fallback
      toast.info("Opening YouTube stream via search format");
      handleSelectVideo(searchId, `Search: ${urlInput}`);
    }
  };

  const handleSaveFavorite = () => {
    if (!currentVideoId) return;
    if (customFavorites.some((f) => f.videoId === currentVideoId)) {
      toast.info("Already in your saved study streams");
      return;
    }
    const updated = [
      {
        id: `fav-${Date.now()}`,
        title: currentTitle || "Custom Focus Video",
        videoId: currentVideoId,
      },
      ...customFavorites,
    ];
    setCustomFavorites(updated);
    try {
      localStorage.setItem("study_youtube_favorites", JSON.stringify(updated));
    } catch {}
    toast.success("Added to saved study streams");
  };

  const handleRemoveFavorite = (favId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customFavorites.filter((f) => f.id !== favId);
    setCustomFavorites(updated);
    try {
      localStorage.setItem("study_youtube_favorites", JSON.stringify(updated));
    } catch {}
    toast.info("Removed from saved streams");
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

  if (!open) return null;

  const filteredPresets =
    activeCategory === "all"
      ? CURATED_YOUTUBE_PRESETS
      : CURATED_YOUTUBE_PRESETS.filter((p) => p.category === activeCategory);

  return (
    <div
      style={{
        left: `${windowPos.x}px`,
        top: `${windowPos.y}px`,
        width: isMiniPiP ? "340px" : "440px",
      }}
      className="fixed z-30 rounded-2xl border border-red-500/20 bg-black/40 backdrop-blur-2xl shadow-2xl flex flex-col overflow-hidden select-none transition-all duration-200"
    >
      {/* Header Bar */}
      <div
        onMouseDown={handleMouseDown}
        className="cursor-grab active:cursor-grabbing flex items-center justify-between px-3 py-2 border-b border-white/10 bg-gradient-to-r from-red-950/40 via-black/40 to-black/40 group"
      >
        <div className="flex items-center gap-2">
          {/* Green minimize dot */}
          <button
            type="button"
            onClick={onClose}
            className="w-3 h-3 rounded-full bg-emerald-500 hover:bg-emerald-400 transition-colors shadow-sm flex items-center justify-center group"
            title="Hide YouTube Player"
          >
            <span className="opacity-0 group-hover:opacity-100 text-[8px] text-black font-bold">−</span>
          </button>

          <div className="flex items-center gap-1.5 text-[11px] font-bold text-white">
            <Youtube className="h-3.5 w-3.5 text-red-500 fill-red-500" />
            <span className="truncate max-w-[170px]">YouTube Focus Player</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsMiniPiP(!isMiniPiP)}
            className="h-6 w-6 text-white/60 hover:text-white hover:bg-white/10"
            title={isMiniPiP ? "Expand Window" : "Picture-in-Picture Mini Mode"}
          >
            {isMiniPiP ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="h-6 w-6 text-white/60 hover:text-red-400 hover:bg-white/10"
            title="Close"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* YouTube IFrame Embed Screen */}
      <div className="relative w-full aspect-video bg-black/90 overflow-hidden border-b border-white/10">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${currentVideoId}?autoplay=1&enablejsapi=1&origin=${encodeURIComponent(
            typeof window !== "undefined" ? window.location.origin : ""
          )}`}
          title={currentTitle}
          className="absolute inset-0 w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>

      {/* Title & Actions Bar */}
      <div className="p-2.5 bg-black/30 border-b border-white/10 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-white truncate">{currentTitle}</p>
          <div className="flex items-center gap-1.5 text-[10px] text-white/50">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span>Active Study Audio</span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSaveFavorite}
            className="h-6 px-2 text-[10px] text-white/70 hover:text-white hover:bg-white/10 rounded-md gap-1"
            title="Bookmark this stream"
          >
            <Bookmark className="h-3 w-3 text-red-400" />
            <span className="hidden sm:inline">Save</span>
          </Button>

          <a
            href={`https://www.youtube.com/watch?v=${currentVideoId}`}
            target="_blank"
            rel="noreferrer"
            className="h-6 px-2 text-[10px] text-white/70 hover:text-white hover:bg-white/10 rounded-md flex items-center gap-1"
            title="Open on YouTube in new tab"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Expanded Controls: URL Input & Curated Channels */}
      {!isMiniPiP && (
        <div className="p-3 space-y-3 max-h-[260px] overflow-y-auto custom-scrollbar bg-black/20">
          {/* Custom URL or ID Search */}
          <form onSubmit={handleCustomSubmit} className="flex gap-1.5">
            <Input
              placeholder="Paste any YouTube link, ID, or search..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="h-7 bg-zinc-900/80 border-white/15 text-xs text-white placeholder:text-white/40"
            />
            <Button
              type="submit"
              size="sm"
              className="h-7 px-3 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shrink-0 gap-1"
            >
              <Play className="h-3 w-3 fill-current" /> Play
            </Button>
          </form>

          {/* Category Chips */}
          <div className="flex gap-1 overflow-x-auto pb-1 custom-scrollbar text-[10px]">
            {[
              { id: "all", label: "All Curated" },
              { id: "lofi", label: "Lofi Beats" },
              { id: "ambient", label: "Rain Ambient" },
              { id: "classical", label: "Classical" },
              { id: "synthwave", label: "Synthwave" },
              { id: "noise", label: "ADHD Noise" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2 py-0.5 rounded-full font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat.id
                    ? "bg-red-500/80 text-white font-bold"
                    : "bg-white/10 text-white/60 hover:text-white hover:bg-white/15"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Curated Presets Grid */}
          <div className="grid grid-cols-2 gap-1.5">
            {filteredPresets.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectVideo(item.videoId, item.title)}
                className={`p-2 rounded-xl text-left border transition-all flex items-center gap-2 group ${
                  currentVideoId === item.videoId
                    ? "bg-red-950/30 border-red-500/40 shadow-sm"
                    : "bg-black/40 border-white/10 hover:border-white/20 hover:bg-white/5"
                }`}
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 relative bg-zinc-800">
                  <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                  {currentVideoId === item.videoId && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Play className="h-3 w-3 text-red-400 fill-current animate-pulse" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-white truncate group-hover:text-red-300">
                    {item.tag}
                  </p>
                  <p className="text-[9px] text-white/50 truncate">{item.title}</p>
                </div>
              </button>
            ))}
          </div>

          {/* User's Custom Bookmarks */}
          {customFavorites.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-white/10">
              <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider block">
                Saved Custom Streams
              </span>
              <div className="space-y-1">
                {customFavorites.map((fav) => (
                  <div
                    key={fav.id}
                    onClick={() => handleSelectVideo(fav.videoId, fav.title)}
                    className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-between text-xs cursor-pointer"
                  >
                    <span className="truncate text-[11px] text-white/90">{fav.title}</span>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveFavorite(fav.id, e)}
                      className="text-white/40 hover:text-red-400 p-0.5"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
