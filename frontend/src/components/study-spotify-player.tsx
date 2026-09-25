import { useState, useEffect, useRef } from "react";
import {
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
  Move,
  Search,
  Plus,
  Music2,
  Check
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
    accent: "#1DB954",
    thumbnail: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=300&auto=format&fit=crop",
  },
  {
    id: "spotify-lofi-beats",
    title: "Lofi Beats",
    subtitle: "Beats to study, relax and focus to",
    type: "playlist",
    embedUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DXdLEN7aqioXM?utm_source=generator&theme=0",
    tag: "Lofi Beats",
    accent: "#1DB954",
    thumbnail: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=300&auto=format&fit=crop",
  },
  {
    id: "spotify-brain-food",
    title: "Brain Food",
    subtitle: "Hypnotic electronic focus music",
    type: "playlist",
    embedUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DX3rxVfibe1L0?utm_source=generator&theme=0",
    tag: "Electronic Focus",
    accent: "#1DB954",
    thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=300&auto=format&fit=crop",
  },
  {
    id: "spotify-peaceful-piano",
    title: "Peaceful Piano",
    subtitle: "Relaxing piano melodies for deep work",
    type: "playlist",
    embedUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DX4sWSpwq3LiO?utm_source=generator&theme=0",
    tag: "Peaceful Piano",
    accent: "#1DB954",
    thumbnail: "https://images.unsplash.com/photo-1520523839898-507127053c37?q=80&w=300&auto=format&fit=crop",
  },
  {
    id: "spotify-jazz-vibes",
    title: "Jazz in the Background",
    subtitle: "Soft instrumental jazz for learning",
    type: "playlist",
    embedUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DX0SM0LYsmbMT?utm_source=generator&theme=0",
    tag: "Coffeehouse Jazz",
    accent: "#1DB954",
    thumbnail: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=300&auto=format&fit=crop",
  },
  {
    id: "spotify-synthwave",
    title: "Synthwave Focus",
    subtitle: "Chilled retro synthesizer melodies",
    type: "playlist",
    embedUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DXdLEN7aqioXM?utm_source=generator&theme=0",
    tag: "Retro Synth",
    accent: "#1DB954",
    thumbnail: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=300&auto=format&fit=crop",
  },
];

export function parseSpotifyEmbedUrl(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  if (trimmed.includes("open.spotify.com/embed/")) {
    return trimmed;
  }

  // Handle standard Spotify Web URLs: https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ
  const webMatch = trimmed.match(/open\.spotify\.com\/(playlist|album|track|artist|show|episode)\/([a-zA-Z0-9]+)/);
  if (webMatch) {
    const type = webMatch[1];
    const id = webMatch[2];
    return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
  }

  // Handle Spotify URIs: spotify:playlist:37i9dQZF1DWZeKCadgRdKQ
  const uriMatch = trimmed.match(/spotify:(playlist|album|track|artist|show|episode):([a-zA-Z0-9]+)/);
  if (uriMatch) {
    const type = uriMatch[1];
    const id = uriMatch[2];
    return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
  }

  return null;
}

interface StudySpotifyPlayerProps {
  open: boolean;
  onClose: () => void;
  pos?: { x: number; y: number };
  onPosChange?: (pos: { x: number; y: number }) => void;
  zIndex?: number;
  onFocus?: () => void;
}

export function StudySpotifyPlayer({
  open,
  onClose,
  pos = { x: 30, y: 70 },
  onPosChange,
  zIndex = 40,
  onFocus,
}: StudySpotifyPlayerProps) {
  const [activePreset, setActivePreset] = useState<SpotifyPreset>(CURATED_SPOTIFY_PRESETS[0]);
  const [customUrlInput, setCustomUrlInput] = useState("");
  const [savedFavorites, setSavedFavorites] = useState<SpotifyPreset[]>(() => {
    try {
      const saved = localStorage.getItem("study_spotify_favorites");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [activeTab, setActiveTab] = useState<"curated" | "favorites" | "custom">("curated");
  const [isCompact, setIsCompact] = useState(false);

  // Movable & Resizable Window Position
  const [windowPos, setWindowPos] = useState(pos);
  const [windowSize, setWindowSize] = useState<{ width: number; height: number }>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("study_spotify_window_size");
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
    return { width: 440, height: 540 };
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
      localStorage.setItem("study_spotify_favorites", JSON.stringify(savedFavorites));
    } catch {}
  }, [savedFavorites]);

  const handleSelectPreset = (preset: SpotifyPreset) => {
    setActivePreset(preset);
  };

  const handleLoadCustomUrl = () => {
    const embed = parseSpotifyEmbedUrl(customUrlInput);
    if (!embed) {
      toast.error("Invalid Spotify URL. Paste a playlist, album, or track link.");
      return;
    }

    const newPreset: SpotifyPreset = {
      id: `custom-${Date.now()}`,
      title: "Custom Spotify Stream",
      subtitle: customUrlInput.split("?")[0],
      type: "playlist",
      embedUrl: embed,
      tag: "Custom",
      accent: "#1DB954",
      thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop",
    };

    setActivePreset(newPreset);
    toast.success("Loaded Spotify music stream");
  };

  const handleSaveFavorite = (preset: SpotifyPreset) => {
    if (savedFavorites.some((f) => f.embedUrl === preset.embedUrl)) {
      toast.info("Already in your favorites");
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
        localStorage.setItem("study_spotify_window_size", JSON.stringify(finalSize));
      } catch {}
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
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
      className={`fixed max-w-[98vw] max-h-[92vh] select-none rounded-2xl border border-white/10 bg-[#121212]/95 backdrop-blur-2xl shadow-2xl shadow-black/90 text-white overflow-hidden flex flex-col font-sans transition-shadow ${
        isCompact ? "h-auto" : ""
      }`}
    >
      {/* 1. Spotify Authentic Header Bar */}
      <div
        onMouseDown={handleMouseDown}
        className="flex items-center justify-between px-3.5 py-2.5 bg-[#000000]/80 border-b border-white/5 cursor-move"
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
            title={isCompact ? "Expand Window" : "Compact Player Mode"}
          >
            {isCompact ? (
              <Maximize2 className="w-2 h-2 text-black/80 opacity-0 hover:opacity-100 transition-opacity" />
            ) : (
              <Minimize2 className="w-2 h-2 text-black/80 opacity-0 hover:opacity-100 transition-opacity" />
            )}
          </button>
          <a
            href="https://open.spotify.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-3 h-3 rounded-full bg-emerald-500/80 hover:bg-emerald-500 border border-emerald-600/60 flex items-center justify-center transition-transform active:scale-90"
            title="Open Full Spotify Web App"
          >
            <ExternalLink className="w-2 h-2 text-black/80 opacity-0 hover:opacity-100 transition-opacity" />
          </a>
        </div>

        {/* Title / Brand */}
        <div className="flex items-center gap-2 text-xs font-bold text-white tracking-wide">
          <span className="w-4 h-4 rounded-full bg-[#1DB954] text-black flex items-center justify-center text-[9px] font-black">
            S
          </span>
          <span>Spotify</span>
          <span className="text-[10px] text-[#1DB954] font-medium bg-[#1DB954]/10 px-1.5 py-0.2 rounded-full border border-[#1DB954]/30">
            Connect
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleSaveFavorite(activePreset)}
            className="h-6 w-6 text-white/60 hover:text-[#1DB954] hover:bg-white/5 rounded-md"
            title="Save to Favorites"
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

      {/* 2. Embedded Official Spotify Iframe Player */}
      <div className="p-3 bg-[#121212]">
        <div className="relative w-full rounded-xl overflow-hidden bg-[#181818] border border-white/5 shadow-inner">
          {(isDragging || isCornerResizing) && <div className="absolute inset-0 z-50 bg-transparent" />}
          <iframe
            key={activePreset.embedUrl}
            src={activePreset.embedUrl}
            width="100%"
            height={isCompact ? "80" : "152"}
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title="Spotify Focus Player"
            className="w-full"
          />
        </div>
      </div>

      {/* 3. Navigation Tabs & Playlist Selector */}
      {!isCompact && (
        <div className="p-3 pt-0 space-y-2.5 text-xs">
          {/* Authentic Spotify Pill Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#181818] border border-white/5">
            <button
              type="button"
              onClick={() => setActiveTab("curated")}
              className={`flex-1 py-1 px-2.5 rounded-full text-[11px] font-semibold transition-all ${
                activeTab === "curated"
                  ? "bg-[#282828] text-white shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Curated
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("favorites")}
              className={`flex-1 py-1 px-2.5 rounded-full text-[11px] font-semibold transition-all flex items-center justify-center gap-1 ${
                activeTab === "favorites"
                  ? "bg-[#282828] text-white shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <span>Library</span>
              {savedFavorites.length > 0 && (
                <span className="w-3.5 h-3.5 rounded-full bg-[#1DB954] text-black text-[9px] font-black flex items-center justify-center">
                  {savedFavorites.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("custom")}
              className={`flex-1 py-1 px-2.5 rounded-full text-[11px] font-semibold transition-all ${
                activeTab === "custom"
                  ? "bg-[#282828] text-white shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Custom Link
            </button>
          </div>

          {/* TAB 1: CURATED PLAYLISTS */}
          {activeTab === "curated" && (
            <div className="grid grid-cols-2 gap-2 max-h-[190px] overflow-y-auto pr-1 custom-scrollbar">
              {CURATED_SPOTIFY_PRESETS.map((preset) => {
                const isSelected = activePreset.id === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-2 rounded-xl cursor-pointer transition-all border text-left group relative flex items-center gap-2 ${
                      isSelected
                        ? "bg-[#282828] border-[#1DB954]/50 text-white shadow-lg"
                        : "bg-[#181818] hover:bg-[#222222] border-white/5 text-white/80 hover:text-white"
                    }`}
                  >
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800">
                      <img
                        src={preset.thumbnail}
                        alt={preset.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="h-4 w-4 text-[#1DB954] fill-[#1DB954]" />
                      </div>
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
                  <Bookmark className="h-6 w-6 mx-auto opacity-30 text-[#1DB954]" />
                  <p>No saved playlists yet.</p>
                  <p className="text-[10px] text-white/30">Bookmark playlists or add custom Spotify links</p>
                </div>
              ) : (
                savedFavorites.map((fav) => (
                  <div
                    key={fav.id}
                    onClick={() => handleSelectPreset(fav)}
                    className="flex items-center justify-between p-2 rounded-xl bg-[#181818] hover:bg-[#222222] border border-white/5 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#282828] flex items-center justify-center text-[#1DB954]">
                        <Music2 className="h-4 w-4" />
                      </div>
                      <div className="truncate">
                        <p className="font-semibold text-xs text-white truncate">{fav.title}</p>
                        <p className="text-[10px] text-white/50 truncate">{fav.subtitle}</p>
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
            <div className="space-y-2 p-2.5 rounded-xl bg-[#181818] border border-white/5">
              <p className="text-[10px] text-white/60">
                Paste any Spotify playlist, album, or song link:
              </p>
              <div className="flex items-center gap-1.5">
                <Input
                  type="text"
                  placeholder="https://open.spotify.com/playlist/..."
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleLoadCustomUrl();
                  }}
                  className="h-8 bg-[#121212] border-white/10 text-xs text-white placeholder-white/30"
                />
                <Button
                  size="sm"
                  onClick={handleLoadCustomUrl}
                  className="h-8 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-xs px-3"
                >
                  Load
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
          title="Drag to resize Spotify window"
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
