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
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Settings,
  Video,
  Music,
  Clock,
  Gamepad2,
  Mic2,
  Briefcase,
  GraduationCap,
  Trees,
  Check,
  Volume2,
  Sparkles,
} from "lucide-react";
import {
  SOUNDSCAPES,
  type SoundscapeType,
} from "@/components/pomodoro-soundscapes";

export type WallpaperCategory = "gamers" | "musicians" | "professionals" | "students" | "nature";

export interface WallpaperItem {
  id: string;
  name: string;
  category: WallpaperCategory;
  type: "video";
  url: string;
  thumb: string;
  accent: string;
  tag: string;
}

// 100% EXCLUSIVELY ANIMATED / LOOPING VIDEOS (All static images removed)
export const STUDY_WALLPAPERS: WallpaperItem[] = [
  // GAMERS
  {
    id: "gamer-cyberpunk-video",
    name: "Cyberpunk Rainy Street",
    category: "gamers",
    type: "video",
    url: "/wallpapers/gamer_cyberpunk.webm",
    thumb: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=300&auto=format&fit=crop",
    accent: "#a855f7",
    tag: "Cyber Street 4K",
  },
  {
    id: "gamer-jellyfish-video",
    name: "Bioluminescent Neon Flow",
    category: "gamers",
    type: "video",
    url: "https://test-videos.co.uk/vids/jellyfish/mp4/h264/360/Jellyfish_360_10s_1MB.mp4",
    thumb: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=300&auto=format&fit=crop",
    accent: "#06b6d4",
    tag: "Neon Glow Loop",
  },
  {
    id: "gamer-sintel-video",
    name: "Cyber Cinematic Flow",
    category: "gamers",
    type: "video",
    url: "https://test-videos.co.uk/vids/sintel/mp4/h264/360/Sintel_360_10s_1MB.mp4",
    thumb: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop",
    accent: "#38bdf8",
    tag: "Sci-Fi Ambience",
  },
  {
    id: "gamer-stars-warp-video",
    name: "Hyperspace Deep Cosmos",
    category: "gamers",
    type: "video",
    url: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4",
    thumb: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=300&auto=format&fit=crop",
    accent: "#ec4899",
    tag: "Cosmic Warp",
  },

  // SINGERS & MUSICIANS
  {
    id: "music-ocean-video",
    name: "Pacific Shoreline Surf",
    category: "musicians",
    type: "video",
    url: "/wallpapers/nature_ocean.mp4",
    thumb: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=300&auto=format&fit=crop",
    accent: "#38bdf8",
    tag: "Harmonic Waves",
  },
  {
    id: "music-flower-video",
    name: "Acoustic Blossom Bloom",
    category: "musicians",
    type: "video",
    url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    thumb: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=300&auto=format&fit=crop",
    accent: "#f59e0b",
    tag: "Organic Growth",
  },
  {
    id: "music-fireplace-video",
    name: "Acoustic Fireplace Lounge",
    category: "musicians",
    type: "video",
    url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    thumb: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=300&auto=format&fit=crop",
    accent: "#ef4444",
    tag: "Warm Fire Glow",
  },
  {
    id: "music-stars-video",
    name: "Starlight Nocturne",
    category: "musicians",
    type: "video",
    url: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4",
    thumb: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300&auto=format&fit=crop",
    accent: "#8b5cf6",
    tag: "Nocturne Melody",
  },

  // PROFESSIONALS
  {
    id: "pro-ocean-video",
    name: "Executive Ocean Horizon",
    category: "professionals",
    type: "video",
    url: "/wallpapers/nature_ocean.mp4",
    thumb: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=300&auto=format&fit=crop",
    accent: "#f59e0b",
    tag: "Horizon Focus",
  },
  {
    id: "pro-cyberpunk-video",
    name: "Downtown Grid Stream",
    category: "professionals",
    type: "video",
    url: "/wallpapers/gamer_cyberpunk.webm",
    thumb: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=300&auto=format&fit=crop",
    accent: "#38bdf8",
    tag: "Metropolis Glow",
  },
  {
    id: "pro-stars-video",
    name: "Global Strategy Starfield",
    category: "professionals",
    type: "video",
    url: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4",
    thumb: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=300&auto=format&fit=crop",
    accent: "#10b981",
    tag: "Executive Vision",
  },

  // STUDENTS & LO-FI
  {
    id: "student-rain-video",
    name: "Raindrops on Study Window",
    category: "students",
    type: "video",
    url: "/wallpapers/gamer_cyberpunk.webm",
    thumb: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=300&auto=format&fit=crop",
    accent: "#06b6d4",
    tag: "Cozy Rain Glass",
  },
  {
    id: "student-fireplace-video",
    name: "Warm Fireplace Reading",
    category: "students",
    type: "video",
    url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    thumb: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=300&auto=format&fit=crop",
    accent: "#f59e0b",
    tag: "Cozy Flame",
  },
  {
    id: "student-ocean-video",
    name: "Ocean Coast Study Retreat",
    category: "students",
    type: "video",
    url: "/wallpapers/nature_ocean.mp4",
    thumb: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=300&auto=format&fit=crop",
    accent: "#8b5cf6",
    tag: "Coastal Library",
  },

  // NATURE & COSMOS
  {
    id: "nature-ocean-video",
    name: "Pacific Ocean Surf",
    category: "nature",
    type: "video",
    url: "/wallpapers/nature_ocean.mp4",
    thumb: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=300&auto=format&fit=crop",
    accent: "#38bdf8",
    tag: "Ocean Waves",
  },
  {
    id: "nature-stars-video",
    name: "Deep Cosmic Night Stars",
    category: "nature",
    type: "video",
    url: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4",
    thumb: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=300&auto=format&fit=crop",
    accent: "#a855f7",
    tag: "Deep Cosmos",
  },
  {
    id: "nature-flower-video",
    name: "Alpine Flower Blooming",
    category: "nature",
    type: "video",
    url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    thumb: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=300&auto=format&fit=crop",
    accent: "#10b981",
    tag: "Mountain Flora",
  },
  {
    id: "nature-rain-video",
    name: "Forest Rain Droplets",
    category: "nature",
    type: "video",
    url: "/wallpapers/gamer_cyberpunk.webm",
    thumb: "https://images.unsplash.com/photo-1441974231531-c627a92ad1ab?q=80&w=300&auto=format&fit=crop",
    accent: "#06b6d4",
    tag: "Forest Rain",
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

  const filteredWallpapers = STUDY_WALLPAPERS.filter((wp) => {
    if (categoryFilter !== "all" && wp.category !== categoryFilter) return false;
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl bg-zinc-950/85 border border-white/15 text-white backdrop-blur-2xl shadow-2xl p-0 gap-0 overflow-hidden max-h-[88vh] flex flex-col rounded-3xl">
        {/* Apple macOS Window Titlebar with Traffic Light Dots */}
        <div className="h-11 px-4 border-b border-white/10 bg-black/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 pr-3 border-r border-white/10">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="h-3 w-3 rounded-full bg-[#ff5f56] border border-[#e0443e] hover:opacity-80 transition-opacity"
                title="Close"
              />
              <span className="h-3 w-3 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
              <span className="h-3 w-3 rounded-full bg-[#27c93f] border border-[#1aab29]" />
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white/90">
              <Settings className="h-3.5 w-3.5 text-purple-400" />
              <span>Study Cockpit Preferences</span>
            </div>
          </div>
          <span className="text-[11px] text-white/40 font-mono">macOS Studio Theme</span>
        </div>

        {/* Apple Segmented Tab Selector */}
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
              <span>Animated Video Loops</span>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* TAB 1: ANIMATED VIDEOS ONLY */}
          {activeTab === "wallpapers" && (
            <div className="space-y-4">
              {/* Category buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pb-1">
                <button
                  type="button"
                  onClick={() => setCategoryFilter("all")}
                  className={`text-xs px-3 py-1 rounded-full border transition-all ${
                    categoryFilter === "all"
                      ? "bg-purple-600 text-white border-purple-500 font-bold"
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                  }`}
                >
                  All Videos
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("gamers")}
                  className={`text-xs px-3 py-1 rounded-full border transition-all flex items-center gap-1.5 ${
                    categoryFilter === "gamers"
                      ? "bg-purple-600 text-white border-purple-500 font-bold"
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                  }`}
                >
                  <Gamepad2 className="h-3 w-3 text-pink-400" />
                  <span>Gamers</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("musicians")}
                  className={`text-xs px-3 py-1 rounded-full border transition-all flex items-center gap-1.5 ${
                    categoryFilter === "musicians"
                      ? "bg-purple-600 text-white border-purple-500 font-bold"
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                  }`}
                >
                  <Mic2 className="h-3 w-3 text-amber-400" />
                  <span>Singers & Musicians</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("professionals")}
                  className={`text-xs px-3 py-1 rounded-full border transition-all flex items-center gap-1.5 ${
                    categoryFilter === "professionals"
                      ? "bg-purple-600 text-white border-purple-500 font-bold"
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                  }`}
                >
                  <Briefcase className="h-3 w-3 text-cyan-400" />
                  <span>Professionals</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("students")}
                  className={`text-xs px-3 py-1 rounded-full border transition-all flex items-center gap-1.5 ${
                    categoryFilter === "students"
                      ? "bg-purple-600 text-white border-purple-500 font-bold"
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                  }`}
                >
                  <GraduationCap className="h-3 w-3 text-emerald-400" />
                  <span>Students & Lo-Fi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("nature")}
                  className={`text-xs px-3 py-1 rounded-full border transition-all flex items-center gap-1.5 ${
                    categoryFilter === "nature"
                      ? "bg-purple-600 text-white border-purple-500 font-bold"
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                  }`}
                >
                  <Trees className="h-3 w-3 text-teal-400" />
                  <span>Nature & Cosmos</span>
                </button>
              </div>

              {/* Looping Videos Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                {filteredWallpapers.map((wp) => {
                  const isActive = activeWallpaper.id === wp.id;
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

                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
                        <span className="bg-purple-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                          <Video className="h-2.5 w-2.5" /> Ambient Loop
                        </span>
                      </div>

                      {isActive && (
                        <div className="absolute top-2.5 right-2.5 h-6 w-6 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg">
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </div>
                      )}

                      <div className="relative z-10 space-y-0.5">
                        <p className="text-xs font-bold text-white drop-shadow truncate">{wp.name}</p>
                        <p className="text-[10px] text-white/70 truncate font-mono">{wp.tag}</p>
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
