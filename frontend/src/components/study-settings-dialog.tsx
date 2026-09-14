import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Settings,
  Image as ImageIcon,
  Video,
  Music,
  Clock,
  Sparkles,
  Gamepad2,
  Mic2,
  Briefcase,
  GraduationCap,
  Trees,
  Check,
  Volume2,
} from "lucide-react";
import {
  SOUNDSCAPES,
  type SoundscapeType,
  soundscapeEngine,
} from "@/components/pomodoro-soundscapes";

export type WallpaperCategory = "gamers" | "musicians" | "professionals" | "students" | "nature";

export interface WallpaperItem {
  id: string;
  name: string;
  category: WallpaperCategory;
  type: "image" | "video";
  url: string;
  thumb: string;
  accent: string;
  tag: string;
}

export const STUDY_WALLPAPERS: WallpaperItem[] = [
  // GAMERS
  {
    id: "gamer-cyberpunk",
    name: "Cyberpunk Battlestation",
    category: "gamers",
    type: "image",
    url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=85&w=2560&auto=format&fit=crop",
    thumb: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=300&auto=format&fit=crop",
    accent: "#a855f7",
    tag: "RGB Gaming Rig",
  },
  {
    id: "gamer-keyboard-video",
    name: "RGB Mechanical Keyboard",
    category: "gamers",
    type: "video",
    url: "https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-playing-on-a-computer-keyboard-41344-large.mp4",
    thumb: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=300&auto=format&fit=crop",
    accent: "#ec4899",
    tag: "Looping Video",
  },
  {
    id: "gamer-synthwave",
    name: "Neon Synthwave Grid",
    category: "gamers",
    type: "image",
    url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=85&w=2560&auto=format&fit=crop",
    thumb: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=300&auto=format&fit=crop",
    accent: "#06b6d4",
    tag: "Outrun 80s",
  },
  {
    id: "gamer-scifi-cockpit",
    name: "Orbital Sci-Fi Cockpit",
    category: "gamers",
    type: "image",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=85&w=2560&auto=format&fit=crop",
    thumb: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop",
    accent: "#38bdf8",
    tag: "Starfighter HUD",
  },

  // SINGERS & MUSICIANS
  {
    id: "music-studio-video",
    name: "Acoustic Recording Studio",
    category: "musicians",
    type: "video",
    url: "https://assets.mixkit.co/videos/preview/mixkit-recording-studio-with-microphones-and-equipment-43467-large.mp4",
    thumb: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=300&auto=format&fit=crop",
    accent: "#f59e0b",
    tag: "Looping Video",
  },
  {
    id: "music-vintage-piano",
    name: "Vintage Grand Piano Loft",
    category: "musicians",
    type: "image",
    url: "https://images.unsplash.com/photo-1520523839898-507127054a0e?q=85&w=2560&auto=format&fit=crop",
    thumb: "https://images.unsplash.com/photo-1520523839898-507127054a0e?q=80&w=300&auto=format&fit=crop",
    accent: "#d97706",
    tag: "Acoustic Warmth",
  },
  {
    id: "music-synth-sanctuary",
    name: "Modular Synth Sanctuary",
    category: "musicians",
    type: "image",
    url: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=85&w=2560&auto=format&fit=crop",
    thumb: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=300&auto=format&fit=crop",
    accent: "#8b5cf6",
    tag: "Electronic Lab",
  },
  {
    id: "music-guitar-lounge",
    name: "Jazz Vinyl & Guitar Lounge",
    category: "musicians",
    type: "image",
    url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=85&w=2560&auto=format&fit=crop",
    thumb: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300&auto=format&fit=crop",
    accent: "#ef4444",
    tag: "Creative Mood",
  },

  // PROFESSIONALS
  {
    id: "pro-tokyo-penthouse",
    name: "Tokyo Skyscraper Dusk",
    category: "professionals",
    type: "image",
    url: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=85&w=2560&auto=format&fit=crop",
    thumb: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=300&auto=format&fit=crop",
    accent: "#38bdf8",
    tag: "Executive Dusk",
  },
  {
    id: "pro-sunset-horizon-video",
    name: "Metropolitan Horizon Sunset",
    category: "professionals",
    type: "video",
    url: "https://assets.mixkit.co/videos/preview/mixkit-set-of-plateaus-seen-from-the-sky-in-a-sunset-26070-large.mp4",
    thumb: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=300&auto=format&fit=crop",
    accent: "#f59e0b",
    tag: "Looping Video",
  },
  {
    id: "pro-scandi-office",
    name: "Nordic Minimalist Corner",
    category: "professionals",
    type: "image",
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=85&w=2560&auto=format&fit=crop",
    thumb: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=300&auto=format&fit=crop",
    accent: "#10b981",
    tag: "Deep Focus Desk",
  },
  {
    id: "pro-architectural-loft",
    name: "Architectural Studio Loft",
    category: "professionals",
    type: "image",
    url: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=85&w=2560&auto=format&fit=crop",
    thumb: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=300&auto=format&fit=crop",
    accent: "#64748b",
    tag: "Executive Studio",
  },

  // STUDENTS & LO-FI
  {
    id: "student-coffee-video",
    name: "Steaming Coffee Shop Window",
    category: "students",
    type: "video",
    url: "https://assets.mixkit.co/videos/preview/mixkit-coffee-mug-and-steam-in-a-coffee-shop-43405-large.mp4",
    thumb: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=300&auto=format&fit=crop",
    accent: "#f59e0b",
    tag: "Looping Video",
  },
  {
    id: "student-lofi-room",
    name: "Cozy Lo-Fi Study Room",
    category: "students",
    type: "image",
    url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=85&w=2560&auto=format&fit=crop",
    thumb: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=300&auto=format&fit=crop",
    accent: "#8b5cf6",
    tag: "Anime Study Vibes",
  },
  {
    id: "student-midnight-library",
    name: "Midnight University Library",
    category: "students",
    type: "image",
    url: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=85&w=2560&auto=format&fit=crop",
    thumb: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=300&auto=format&fit=crop",
    accent: "#38bdf8",
    tag: "Quiet Archives",
  },
  {
    id: "student-autumn-desk",
    name: "Warm Autumn Window",
    category: "students",
    type: "image",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=85&w=2560&auto=format&fit=crop",
    thumb: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=300&auto=format&fit=crop",
    accent: "#10b981",
    tag: "Gentle Breeze",
  },

  // NATURE & SPACE
  {
    id: "nature-stars-video",
    name: "Drifting Deep Cosmic Stars",
    category: "nature",
    type: "video",
    url: "https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-1610-large.mp4",
    thumb: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=300&auto=format&fit=crop",
    accent: "#a855f7",
    tag: "Looping Video",
  },
  {
    id: "nature-rain-lake-video",
    name: "Rain Falling on Water",
    category: "nature",
    type: "video",
    url: "https://assets.mixkit.co/videos/preview/mixkit-rain-falling-on-the-water-of-a-lake-19532-large.mp4",
    thumb: "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?q=80&w=300&auto=format&fit=crop",
    accent: "#06b6d4",
    tag: "Looping Video",
  },
  {
    id: "nature-misty-pines",
    name: "Misty Nordic Pine Forest",
    category: "nature",
    type: "image",
    url: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=85&w=2560&auto=format&fit=crop",
    thumb: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=300&auto=format&fit=crop",
    accent: "#10b981",
    tag: "Alpine Serenity",
  },
  {
    id: "nature-nebula-observatory",
    name: "Cosmic Nebula Observatory",
    category: "nature",
    type: "image",
    url: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=85&w=2560&auto=format&fit=crop",
    thumb: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=300&auto=format&fit=crop",
    accent: "#c084fc",
    tag: "Deep Cosmos",
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
  const [categoryFilter, setCategoryFilter] = useState<"all" | WallpaperCategory>("all");
  const [mediaFilter, setMediaFilter] = useState<"all" | "image" | "video">("all");

  const filteredWallpapers = STUDY_WALLPAPERS.filter((wp) => {
    if (categoryFilter !== "all" && wp.category !== categoryFilter) return false;
    if (mediaFilter !== "all" && wp.type !== mediaFilter) return false;
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl bg-zinc-950/95 border border-white/20 text-white backdrop-blur-2xl shadow-2xl p-0 gap-0 overflow-hidden max-h-[88vh] flex flex-col">
        {/* Header */}
        <DialogHeader className="p-6 border-b border-white/10 flex flex-row items-center justify-between pb-4">
          <div>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-white">
              <Settings className="h-5 w-5 text-purple-400" />
              <span>Study Mode Cockpit Settings</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-white/60 mt-0.5">
              Customize 4K backdrops, ambient video loops, Pomodoro sprint lengths, and Web Audio soundscapes.
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex border-b border-white/10 px-6 bg-black/40 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab("wallpapers")}
            className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "wallpapers"
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            <span>4K Wallpapers & Looping Videos</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("timer")}
            className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "timer"
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Pomodoro Durations</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("audio")}
            className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "audio"
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            <Music className="h-3.5 w-3.5" />
            <span>Soundscapes & Volume</span>
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* TAB 1: WALLPAPERS */}
          {activeTab === "wallpapers" && (
            <div className="space-y-4">
              {/* Category buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pb-1">
                <button
                  type="button"
                  onClick={() => setCategoryFilter("all")}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    categoryFilter === "all"
                      ? "bg-purple-600 text-white border-purple-500"
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                  }`}
                >
                  All Themes
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("gamers")}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                    categoryFilter === "gamers"
                      ? "bg-purple-600 text-white border-purple-500"
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                  }`}
                >
                  <Gamepad2 className="h-3.5 w-3.5 text-pink-400" />
                  <span>Gamers</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("musicians")}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                    categoryFilter === "musicians"
                      ? "bg-purple-600 text-white border-purple-500"
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                  }`}
                >
                  <Mic2 className="h-3.5 w-3.5 text-amber-400" />
                  <span>Singers & Musicians</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("professionals")}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                    categoryFilter === "professionals"
                      ? "bg-purple-600 text-white border-purple-500"
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                  }`}
                >
                  <Briefcase className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Professionals</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("students")}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                    categoryFilter === "students"
                      ? "bg-purple-600 text-white border-purple-500"
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                  }`}
                >
                  <GraduationCap className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Students & Lo-Fi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("nature")}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                    categoryFilter === "nature"
                      ? "bg-purple-600 text-white border-purple-500"
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                  }`}
                >
                  <Trees className="h-3.5 w-3.5 text-teal-400" />
                  <span>Nature & Cosmos</span>
                </button>
              </div>

              {/* Media type toggle */}
              <div className="flex items-center gap-2 text-xs text-white/60">
                <span>Filter Media:</span>
                <button
                  type="button"
                  onClick={() => setMediaFilter("all")}
                  className={`px-2 py-0.5 rounded text-[11px] ${mediaFilter === "all" ? "bg-white/20 text-white font-bold" : "hover:text-white"}`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setMediaFilter("video")}
                  className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1 ${mediaFilter === "video" ? "bg-purple-500/30 text-purple-300 font-bold" : "hover:text-white"}`}
                >
                  <Video className="h-3 w-3" />
                  <span>Looping Videos</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMediaFilter("image")}
                  className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1 ${mediaFilter === "image" ? "bg-purple-500/30 text-purple-300 font-bold" : "hover:text-white"}`}
                >
                  <ImageIcon className="h-3 w-3" />
                  <span>4K Images</span>
                </button>
              </div>

              {/* Wallpaper Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                {filteredWallpapers.map((wp) => {
                  const isActive = activeWallpaper.id === wp.id;
                  return (
                    <button
                      key={wp.id}
                      type="button"
                      onClick={() => onSelectWallpaper(wp)}
                      className={`group relative rounded-xl overflow-hidden border text-left transition-all h-36 flex flex-col justify-end p-2.5 ${
                        isActive
                          ? "ring-2 ring-purple-400 border-purple-400 shadow-lg scale-[1.02]"
                          : "border-white/15 opacity-80 hover:opacity-100 hover:border-white/40"
                      }`}
                    >
                      <img
                        src={wp.thumb}
                        alt={wp.name}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex items-center gap-1">
                        {wp.type === "video" ? (
                          <span className="bg-purple-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                            <Video className="h-2.5 w-2.5" /> Video Loop
                          </span>
                        ) : (
                          <span className="bg-black/60 text-white/90 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            4K UHD
                          </span>
                        )}
                      </div>

                      {isActive && (
                        <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg">
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </div>
                      )}

                      <div className="relative z-10 space-y-0.5">
                        <p className="text-xs font-bold text-white drop-shadow truncate">{wp.name}</p>
                        <p className="text-[10px] text-white/70 truncate">{wp.tag}</p>
                      </div>
                    </button>
                  );
                })}
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
                  Recommended: 25m for high intensity, 50m for complex problem solving.
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
                  Triggered after each focus sprint (1–3).
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
                  Automatically activated after 4 completed focus sprints.
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
                        className={`p-2.5 rounded-xl border text-left transition-all ${
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
            className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-5"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
