import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Settings,
  Video,
  Music,
  Clock,
  Check,
  Volume2,
  Plus,
  Trash2,
  Upload,
  FolderOpen,
  Sparkles,
} from "lucide-react";
import {
  SOUNDSCAPES,
  type SoundscapeType,
} from "@/components/pomodoro-soundscapes";
import { toast } from "sonner";

export interface WallpaperItem {
  id: string;
  name: string;
  category: "nature" | "custom";
  type: "video";
  url: string;
  thumb: string;
  accent: string;
  tag: string;
}

// Exactly 1 Nature loop and 1 Earth loop (5-10 second loops)
export const STUDY_WALLPAPERS: WallpaperItem[] = [
  {
    id: "nature-ocean-loop",
    name: "Pacific Shoreline Nature",
    category: "nature",
    type: "video",
    url: "/wallpapers/nature_ocean.mp4",
    thumb: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=300&auto=format&fit=crop",
    accent: "#38bdf8",
    tag: "Nature Ocean",
  },
  {
    id: "earth-orbit-loop",
    name: "Planet Earth & Space",
    category: "nature",
    type: "video",
    url: "/wallpapers/earth_orbit.webm",
    thumb: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=300&auto=format&fit=crop",
    accent: "#3b82f6",
    tag: "Earth Orbit",
  },
];

interface StudySettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeWallpaper: WallpaperItem;
  onSelectWallpaper: (wp: WallpaperItem) => void;
  focusMinutes: number;
  onFocusMinutesChange: (mins: number) => void;
  breakMinutes: number;
  onBreakMinutesChange: (mins: number) => void;
  longBreakMinutes: number;
  onLongBreakMinutesChange: (mins: number) => void;
  activeSoundscape: SoundscapeType;
  onSoundscapeChange: (sc: SoundscapeType) => void;
  soundVolume: number;
  onVolumeChange: (vol: number) => void;
}

export function StudySettingsDialog({
  open,
  onOpenChange,
  activeWallpaper,
  onSelectWallpaper,
  focusMinutes,
  onFocusMinutesChange,
  breakMinutes,
  onBreakMinutesChange,
  longBreakMinutes,
  onLongBreakMinutesChange,
  activeSoundscape,
  onSoundscapeChange,
  soundVolume,
  onVolumeChange,
}: StudySettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<"wallpapers" | "timer" | "audio">("wallpapers");

  // Custom wallpapers list stored in localStorage (no database needed)
  const [customWallpapers, setCustomWallpapers] = useState<WallpaperItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("study_custom_wallpapers");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  // Custom video adder state
  const [customPath, setCustomPath] = useState("");
  const [customTag, setCustomTag] = useState("");
  const [customName, setCustomName] = useState("");
  const [customThumb, setCustomThumb] = useState("");
  const [isCapturingThumb, setIsCapturingThumb] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Generate thumbnail from video URL / blob
  const extractThumbnail = (videoUrl: string) => {
    setIsCapturingThumb(true);
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;
    video.currentTime = 0.5;

    video.onloadeddata = () => {
      video.currentTime = Math.min(1, (video.duration || 2) / 2);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 320;
        canvas.height = 180;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, 320, 180);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
          setCustomThumb(dataUrl);
        }
      } catch (e) {
        // Fallback default thumb if canvas is restricted
        setCustomThumb("https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=300&auto=format&fit=crop");
      } finally {
        setIsCapturingThumb(false);
      }
    };

    video.onerror = () => {
      setCustomThumb("https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=300&auto=format&fit=crop");
      setIsCapturingThumb(false);
    };
  };

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setCustomPath(objectUrl);
    const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    setCustomName(baseName.charAt(0).toUpperCase() + baseName.slice(1));
    if (!customTag) setCustomTag("Custom Video");
    extractThumbnail(objectUrl);
    toast.success(`Selected local video: ${file.name}`);
  };

  // Handle manual path/URL input
  const handleManualPathBlur = () => {
    if (customPath.trim() && !customThumb) {
      extractThumbnail(customPath.trim());
    }
  };

  // Save custom video wallpaper
  const handleAddCustomWallpaper = () => {
    if (!customPath.trim()) {
      toast.error("Please provide a video file or file path");
      return;
    }

    const newItem: WallpaperItem = {
      id: "custom-" + Date.now(),
      name: customName.trim() || "Custom Video",
      category: "custom",
      type: "video",
      url: customPath.trim(),
      thumb:
        customThumb ||
        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=300&auto=format&fit=crop",
      accent: "#a855f7",
      tag: customTag.trim() || "Custom Video",
    };

    const updated = [newItem, ...customWallpapers];
    setCustomWallpapers(updated);
    try {
      localStorage.setItem("study_custom_wallpapers", JSON.stringify(updated));
    } catch {}

    onSelectWallpaper(newItem);
    setCustomPath("");
    setCustomTag("");
    setCustomName("");
    setCustomThumb("");
    toast.success(`Custom wallpaper "${newItem.name}" added & applied!`);
  };

  // Delete custom video wallpaper
  const handleDeleteCustomWallpaper = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = customWallpapers.filter((w) => w.id !== id);
    setCustomWallpapers(updated);
    try {
      localStorage.setItem("study_custom_wallpapers", JSON.stringify(updated));
    } catch {}
    if (activeWallpaper.id === id) {
      onSelectWallpaper(STUDY_WALLPAPERS[0]);
    }
    toast.info("Custom video wallpaper removed");
  };

  const allDisplayWallpapers = [...STUDY_WALLPAPERS, ...customWallpapers];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl bg-zinc-950/85 border border-white/15 text-white backdrop-blur-2xl shadow-2xl p-0 gap-0 overflow-hidden max-h-[88vh] flex flex-col rounded-3xl">
        {/* Header: Titlebar with "Preferences" title (macOS Studio Theme removed) */}
        <div className="h-11 px-4 border-b border-white/10 bg-black/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-3 w-3 rounded-full bg-emerald-500 hover:bg-emerald-400 transition-colors shadow-sm"
              title="Close Preferences"
            />
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white/90">
              <Settings className="h-3.5 w-3.5 text-purple-400" />
              <span>Preferences</span>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="p-3 border-b border-white/10 bg-black/30 flex justify-center">
          <div className="p-1 rounded-xl bg-white/10 border border-white/10 inline-flex gap-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("wallpapers")}
              className={`px-4 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                activeTab === "wallpapers"
                  ? "bg-white/25 text-white shadow-md"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Video className="h-3.5 w-3.5 text-purple-400" />
              <span>Video Wallpapers</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("timer")}
              className={`px-4 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                activeTab === "timer"
                  ? "bg-white/25 text-white shadow-md"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              <span>Timer Durations</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("audio")}
              className={`px-4 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                activeTab === "audio"
                  ? "bg-white/25 text-white shadow-md"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Music className="h-3.5 w-3.5 text-emerald-400" />
              <span>Soundscapes</span>
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: WALLPAPERS (1 NATURE, 1 EARTH + CUSTOM VIDEO UPLOADER) */}
          {activeTab === "wallpapers" && (
            <div className="space-y-6">
              {/* Wallpaper Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-white/80">Available Video Loops</Label>
                  <span className="text-[11px] text-white/50">{allDisplayWallpapers.length} Wallpapers</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {allDisplayWallpapers.map((wp) => {
                    const isActive = activeWallpaper.id === wp.id;
                    const isCustom = wp.category === "custom";
                    return (
                      <button
                        key={wp.id}
                        type="button"
                        onClick={() => onSelectWallpaper(wp)}
                        className={`group relative rounded-2xl overflow-hidden border text-left transition-all h-36 flex flex-col justify-end p-3 ${
                          isActive
                            ? "ring-2 ring-purple-400 border-purple-400 shadow-xl scale-[1.02]"
                            : "border-white/15 opacity-80 hover:opacity-100 hover:border-white/40"
                        }`}
                      >
                        <img
                          src={wp.thumb}
                          alt={wp.name}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />

                        {/* Top badge with tag */}
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                          <span className="bg-purple-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                            <Video className="h-2.5 w-2.5" />
                            <span>{wp.tag}</span>
                          </span>
                        </div>

                        {/* Active check or Delete custom button */}
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                          {isCustom && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteCustomWallpaper(e, wp.id)}
                              className="h-6 w-6 rounded-full bg-black/60 hover:bg-red-600/80 text-white/70 hover:text-white flex items-center justify-center transition-colors shadow"
                              title="Delete Custom Video"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                          {isActive && (
                            <div className="h-6 w-6 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg">
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                            </div>
                          )}
                        </div>

                        <div className="relative z-10 space-y-0.5">
                          <p className="text-xs font-bold text-white drop-shadow truncate">{wp.name}</p>
                          <p className="text-[10px] text-white/70 truncate font-mono">
                            {isCustom ? "Custom Video Loop" : "5–10s Loop"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ADD CUSTOM VIDEO SECTION */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/15 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  <h4 className="text-xs font-bold text-white">Add Custom Video Wallpaper</h4>
                </div>
                <p className="text-[11px] text-white/60">
                  Select a local video file from your computer or enter a file path / URL. No database storage needed;
                  we remember the path locally and capture a cover thumbnail.
                </p>

                {/* Hidden File Input */}
                <input
                  type="file"
                  accept="video/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* File / URL Input */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-white/80">Video File or Path / URL</Label>
                    <div className="flex gap-1.5">
                      <Input
                        placeholder="e.g. C:\Videos\loop.mp4 or URL..."
                        value={customPath}
                        onChange={(e) => setCustomPath(e.target.value)}
                        onBlur={handleManualPathBlur}
                        className="h-8 bg-zinc-900 border-white/20 text-xs text-white"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-8 px-2.5 border-white/20 bg-white/10 hover:bg-white/20 text-white shrink-0 text-xs gap-1"
                        title="Browse local video file"
                      >
                        <FolderOpen className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Browse</span>
                      </Button>
                    </div>
                  </div>

                  {/* Desired Tag Input */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-white/80">Desired Tag / Category</Label>
                    <Input
                      placeholder="e.g. Synthwave, Gaming, Lo-Fi, Anime..."
                      value={customTag}
                      onChange={(e) => setCustomTag(e.target.value)}
                      className="h-8 bg-zinc-900 border-white/20 text-xs text-white"
                    />
                  </div>
                </div>

                {/* Video Name & Thumbnail Preview */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-3">
                    {customThumb ? (
                      <div className="relative w-20 h-12 rounded-lg overflow-hidden border border-purple-400 shadow-md shrink-0">
                        <img src={customThumb} alt="Preview" className="w-full h-full object-cover" />
                        <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-[8px] text-white px-1 rounded">
                          Cover
                        </span>
                      </div>
                    ) : isCapturingThumb ? (
                      <div className="w-20 h-12 rounded-lg border border-dashed border-white/20 flex items-center justify-center text-[9px] text-white/40 shrink-0">
                        Generating...
                      </div>
                    ) : null}

                    <div className="space-y-1">
                      <Input
                        placeholder="Wallpaper Title (optional)..."
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="h-7 w-56 bg-zinc-900 border-white/20 text-[11px] text-white"
                      />
                    </div>
                  </div>

                  <Button
                    size="sm"
                    type="button"
                    onClick={handleAddCustomWallpaper}
                    disabled={!customPath.trim()}
                    className="h-8 px-4 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold gap-1.5 shadow-md"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Apply Custom Video</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TIMER INTERVALS */}
          {activeTab === "timer" && (
            <div className="space-y-6 max-w-lg py-2">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <Label className="text-white font-medium">Deep Work Focus Sprint</Label>
                  <span className="font-bold text-purple-400">{focusMinutes} minutes</span>
                </div>
                <Slider
                  min={15}
                  max={90}
                  step={5}
                  value={[focusMinutes]}
                  onValueChange={(v) => onFocusMinutesChange(v[0])}
                />
                <p className="text-[11px] text-white/50">
                  Calibrated interval for intense uninterrupted workflow.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <Label className="text-white font-medium">Short Recovery Break</Label>
                  <span className="font-bold text-cyan-400">{breakMinutes} minutes</span>
                </div>
                <Slider
                  min={3}
                  max={15}
                  step={1}
                  value={[breakMinutes]}
                  onValueChange={(v) => onBreakMinutesChange(v[0])}
                />
                <p className="text-[11px] text-white/50">
                  Quick hydration and eye rest between focus sprints.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <Label className="text-white font-medium">Long Recovery Window</Label>
                  <span className="font-bold text-emerald-400">{longBreakMinutes} minutes</span>
                </div>
                <Slider
                  min={10}
                  max={45}
                  step={5}
                  value={[longBreakMinutes]}
                  onValueChange={(v) => onLongBreakMinutesChange(v[0])}
                />
                <p className="text-[11px] text-white/50">
                  Full cognitive refresh triggered after 4 completed focus sprints.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIO & SOUNDSCAPES */}
          {activeTab === "audio" && (
            <div className="space-y-6 max-w-lg py-2">
              <div className="space-y-2">
                <Label className="text-xs text-white">Default Ambient Soundscape</Label>
                <div className="grid grid-cols-2 gap-2">
                  {SOUNDSCAPES.map((sc) => {
                    const isSelected = activeSoundscape === sc.id;
                    return (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => onSoundscapeChange(sc.id)}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? "bg-purple-600/30 border-purple-400 text-white ring-1 ring-purple-400/50"
                            : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                        }`}
                      >
                        <p className="text-xs font-bold text-white flex items-center justify-between">
                          <span>{sc.name}</span>
                          {isSelected && <Check className="h-3 w-3 text-purple-400" />}
                        </p>
                        <p className="text-[10px] text-white/50 line-clamp-1 mt-0.5">{sc.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex justify-between text-xs">
                  <Label className="text-white flex items-center gap-1.5">
                    <Volume2 className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Master Soundscape Volume</span>
                  </Label>
                  <span className="font-bold text-cyan-400">{Math.round(soundVolume * 100)}%</span>
                </div>
                <Slider
                  min={0}
                  max={1}
                  step={0.05}
                  value={[soundVolume]}
                  onValueChange={(v) => onVolumeChange(v[0])}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t border-white/10 bg-black/40 flex justify-end">
          <Button
            size="sm"
            onClick={() => onOpenChange(false)}
            className="bg-white/20 hover:bg-white/30 text-white font-semibold px-6 rounded-xl text-xs"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
