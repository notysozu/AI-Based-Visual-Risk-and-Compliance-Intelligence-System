import { useState, useEffect, useRef } from "react";
import {
  Music,
  ExternalLink,
  Sparkles,
  Bookmark,
  Trash2,
  Play,
  X,
  Maximize2,
  Minimize2,
  Radio,
  Headphones,
  Sliders,
  Move
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export interface SpotifyPreset {
  id: string;
  title: string;
  subtitle: string;
  type: "playlist" | "album" | "track";
  embedUrl: string;
  tag: string;
  accent: string;
  thumbnail: string;
}

export const CURATED_SPOTIFY_PRESETS: SpotifyPreset[] = [
  {
    id: "spotify-deep-focus",
    title: "Deep Focus",
    subtitle: "Atmospheric & calm beats for concentration",
    type: "playlist",
    embedUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DWZeKCadgRdKQ?utm_source=generator&theme=0",
    tag: "Deep Focus",
    accent: "#10b981",
    thumbnail: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=300&auto=format&fit=crop",
  },
  {
    id: "spotify-lofi-beats",
    title: "Lofi Beats",
    subtitle: "Beats to study, relax and focus to",
    type: "playlist",
    embedUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DXdLEN7aqioXM?utm_source=generator&theme=0",
    tag: "Lofi Beats",
    accent: "#8b5cf6",
    thumbnail: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=300&auto=format&fit=crop",
  },
  {
    id: "spotify-brain-food",
    title: "Brain Food",
    subtitle: "Hypnotic electronic focus music",
    type: "playlist",
    embedUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DX3rxVfibe1L0?utm_source=generator&theme=0",
    tag: "Electronic Focus",
    accent: "#06b6d4",
    thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=300&auto=format&fit=crop",
  },
  {
    id: "spotify-peaceful-piano",
    title: "Peaceful Piano",
    subtitle: "Relaxing piano melodies for deep work",
    type: "playlist",
    embedUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DX4sWSpwq3LiO?utm_source=generator&theme=0",
    tag: "Peaceful Piano",
    accent: "#ec4899",
    thumbnail: "https://images.unsplash.com/photo-1520523839898-507127053c37?q=80&w=300&auto=format&fit=crop",
  },
  {
    id: "spotify-jazz-vibes",
    title: "Jazz in the Background",
    subtitle: "Soft instrumental jazz for learning",
    type: "playlist",
    embedUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DX0SM0LYsmbMT?utm_source=generator&theme=0",
    tag: "Coffeehouse Jazz",
    accent: "#f59e0b",
    thumbnail: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=300&auto=format&fit=crop",
  },
  {
    id: "spotify-synthwave",
    title: "Synthwave / Retro Focus",
    subtitle: "Chilled 80s synthesizer melodies",
    type: "playlist",
    embedUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DXdLEN7aqioXM?utm_source=generator&theme=0",
    tag: "Retro Synth",
    accent: "#6366f1",
    thumbnail: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=300&auto=format&fit=crop",
  },
];

export function parseSpotifyEmbedUrl(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // If already an embed URL
  if (trimmed.includes("open.spotify.com/embed/")) {
    return trimmed.includes("?") ? trimmed : `${trimmed}?utm_source=generator&theme=0`;
  }

  // Handle open.spotify.com URL
  // e.g. https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ?si=...
  try {
    const match = trimmed.match(/open\.spotify\.com\/(playlist|album|track|artist|episode)\/([a-zA-Z0-9]+)/);
    if (match && match[1] && match[2]) {
      return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0`;
    }
  } catch {}

  // Handle spotify URI e.g. spotify:playlist:37i9dQZF1DWZeKCadgRdKQ
  const uriMatch = trimmed.match(/spotify:(playlist|album|track|artist|episode):([a-zA-Z0-9]+)/);
  if (uriMatch && uriMatch[1] && uriMatch[2]) {
    return `https://open.spotify.com/embed/${uriMatch[1]}/${uriMatch[2]}?utm_source=generator&theme=0`;
  }

  return null;
}

interface StudySpotifyPlayerProps {
  open: boolean;
  onClose: () => void;
  pos?: { x: number; y: number };
  onPosChange?: (pos: { x: number; y: number }) => void;
}

export function StudySpotifyPlayer({
  open,
  onClose,
  pos = { x: 440, y: 68 },
  onPosChange,
}: StudySpotifyPlayerProps) {
  const [currentEmbedUrl, setCurrentEmbedUrl] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("study_spotify_current_url") || CURATED_SPOTIFY_PRESETS[0].embedUrl;
    }
    return CURATED_SPOTIFY_PRESETS[0].embedUrl;
  });

  const [currentTitle, setCurrentTitle] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("study_spotify_current_title") || CURATED_SPOTIFY_PRESETS[0].title;
    }
    return CURATED_SPOTIFY_PRESETS[0].title;
  });

  const [urlInput, setUrlInput] = useState("");
  const [isCompactMode, setIsCompactMode] = useState(false);

  // Custom Saved Playlists
  const [customFavorites, setCustomFavorites] = useState<{ id: string; title: string; embedUrl: string }[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("study_spotify_favorites");
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

  const handleSelectPreset = (preset: SpotifyPreset) => {
    setCurrentEmbedUrl(preset.embedUrl);
    setCurrentTitle(preset.title);
    try {
      localStorage.setItem("study_spotify_current_url", preset.embedUrl);
      localStorage.setItem("study_spotify_current_title", preset.title);
    } catch {}
    toast.success(`Spotify loaded: ${preset.title}`);
  };

  const handleCustomSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!urlInput.trim()) return;

    const parsed = parseSpotifyEmbedUrl(urlInput);
    if (parsed) {
      setCurrentEmbedUrl(parsed);
      setCurrentTitle("Custom Spotify Stream");
      try {
        localStorage.setItem("study_spotify_current_url", parsed);
        localStorage.setItem("study_spotify_current_title", "Custom Spotify Stream");
      } catch {}
      setUrlInput("");
      toast.success("Loaded custom Spotify playlist/track");
    } else {
      toast.error("Please paste a valid Spotify playlist, album, or track link");
    }
  };

  const handleSaveFavorite = () => {
    if (customFavorites.some((f) => f.embedUrl === currentEmbedUrl)) {
      toast.info("Already in your saved Spotify playlists");
      return;
    }
    const updated = [
      {
        id: `fav-spot-${Date.now()}`,
        title: currentTitle || "Custom Playlist",
        embedUrl: currentEmbedUrl,
      },
      ...customFavorites,
    ];
    setCustomFavorites(updated);
    try {
      localStorage.setItem("study_spotify_favorites", JSON.stringify(updated));
    } catch {}
    toast.success("Added to saved Spotify playlists");
  };

  const handleRemoveFavorite = (favId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customFavorites.filter((f) => f.id !== favId);
    setCustomFavorites(updated);
    try {
      localStorage.setItem("study_spotify_favorites", JSON.stringify(updated));
    } catch {}
    toast.info("Removed from saved playlists");
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

  return (
    <div
      style={{
        left: `${windowPos.x}px`,
        top: `${windowPos.y}px`,
        width: isCompactMode ? "340px" : "420px",
      }}
      className="fixed z-30 rounded-2xl border border-emerald-500/20 bg-black/40 backdrop-blur-2xl shadow-2xl flex flex-col overflow-hidden select-none transition-all duration-200"
    >
      {/* Header Bar */}
      <div
        onMouseDown={handleMouseDown}
        className="cursor-grab active:cursor-grabbing flex items-center justify-between px-3 py-2 border-b border-white/10 bg-gradient-to-r from-emerald-950/40 via-black/40 to-black/40 group"
      >
        <div className="flex items-center gap-2">
          {/* Green minimize dot */}
          <button
            type="button"
            onClick={onClose}
            className="w-3 h-3 rounded-full bg-emerald-500 hover:bg-emerald-400 transition-colors shadow-sm flex items-center justify-center group"
            title="Hide Spotify Player"
          >
            <span className="opacity-0 group-hover:opacity-100 text-[8px] text-black font-bold">−</span>
          </button>

          <div className="flex items-center gap-1.5 text-[11px] font-bold text-white">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center text-black font-black text-[9px]">
              S
            </span>
            <span className="truncate max-w-[170px]">Spotify Focus Audio</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsCompactMode(!isCompactMode)}
            className="h-6 w-6 text-white/60 hover:text-white hover:bg-white/10"
            title={isCompactMode ? "Expand Library" : "Compact Player Only"}
          >
            {isCompactMode ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="h-6 w-6 text-white/60 hover:text-emerald-400 hover:bg-white/10"
            title="Close"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Spotify Official Responsive Embed Iframe */}
      <div className="w-full bg-black/90 border-b border-white/10 p-1">
        <iframe
          src={currentEmbedUrl}
          width="100%"
          height={isCompactMode ? "152" : "232"}
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="rounded-xl"
          title="Spotify Focus Player"
        />
      </div>

      {/* Actions & Connect Bar */}
      <div className="p-2.5 bg-black/30 border-b border-white/10 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-white truncate">{currentTitle}</p>
          <div className="flex items-center gap-1.5 text-[10px] text-white/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Spotify Connect Enabled</span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSaveFavorite}
            className="h-6 px-2 text-[10px] text-white/70 hover:text-white hover:bg-white/10 rounded-md gap-1"
            title="Bookmark playlist"
          >
            <Bookmark className="h-3 w-3 text-emerald-400" />
            <span className="hidden sm:inline">Save</span>
          </Button>

          <a
            href="https://open.spotify.com"
            target="_blank"
            rel="noreferrer"
            className="h-6 px-2 text-[10px] bg-emerald-600/80 hover:bg-emerald-500 text-white rounded-md flex items-center gap-1 font-semibold"
            title="Open Spotify Web App to control devices"
          >
            <ExternalLink className="h-3 w-3" />
            <span>Open App</span>
          </a>
        </div>
      </div>

      {/* Curated Focus Playlists & Link Input */}
      {!isCompactMode && (
        <div className="p-3 space-y-3 max-h-[240px] overflow-y-auto custom-scrollbar bg-black/20">
          {/* Custom Spotify Link Input */}
          <form onSubmit={handleCustomSubmit} className="flex gap-1.5">
            <Input
              placeholder="Paste Spotify playlist, album, or track link..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="h-7 bg-zinc-900/80 border-white/15 text-xs text-white placeholder:text-white/40"
            />
            <Button
              type="submit"
              size="sm"
              className="h-7 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shrink-0 gap-1"
            >
              <Play className="h-3 w-3 fill-current" /> Load
            </Button>
          </form>

          {/* Curated Presets Grid */}
          <div className="grid grid-cols-2 gap-1.5">
            {CURATED_SPOTIFY_PRESETS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectPreset(item)}
                className={`p-2 rounded-xl text-left border transition-all flex items-center gap-2 group ${
                  currentEmbedUrl === item.embedUrl
                    ? "bg-emerald-950/30 border-emerald-500/40 shadow-sm"
                    : "bg-black/40 border-white/10 hover:border-white/20 hover:bg-white/5"
                }`}
              >
                <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 relative bg-zinc-800">
                  <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                  {currentEmbedUrl === item.embedUrl && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Play className="h-3 w-3 text-emerald-400 fill-current animate-pulse" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-white truncate group-hover:text-emerald-300">
                    {item.title}
                  </p>
                  <p className="text-[9px] text-white/50 truncate">{item.tag}</p>
                </div>
              </button>
            ))}
          </div>

          {/* User's Custom Bookmarks */}
          {customFavorites.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-white/10">
              <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider block">
                Saved Playlists
              </span>
              <div className="space-y-1">
                {customFavorites.map((fav) => (
                  <div
                    key={fav.id}
                    onClick={() => {
                      setCurrentEmbedUrl(fav.embedUrl);
                      setCurrentTitle(fav.title);
                    }}
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
