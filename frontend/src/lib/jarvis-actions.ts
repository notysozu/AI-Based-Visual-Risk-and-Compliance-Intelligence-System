/**
 * JARVIS Modular Action Registry & Screen Control Engine
 * Allows JARVIS to autonomously inspect, control, and trigger actions across
 * all modules in the study cockpit, and easily register future modules.
 */

export type JarvisAppId =
  | "youtube"
  | "spotify"
  | "browser"
  | "notes"
  | "workspace"
  | "settings";

export interface JarvisActionPayload {
  type: string;
  app?: JarvisAppId;
  duration?: number;
  mode?: "focus" | "shortBreak" | "longBreak";
  note?: {
    title: string;
    content: string;
    category?: "ideas" | "study" | "formulas" | "quick";
  };
  wallpaper?: string;
  customId?: string;
  customData?: any;
}

export interface JarvisCockpitContext {
  openApp: (app: JarvisAppId) => void;
  closeApp: (app: JarvisAppId) => void;
  toggleApp: (app: JarvisAppId) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  setTimerMinutes: (minutes: number) => void;
  setTimerMode: (mode: "focus" | "shortBreak" | "longBreak") => void;
  createNote: (note: { title: string; content: string; category?: string }) => Promise<void>;
  setWallpaperByTheme: (themeKeyword: string) => boolean;
  subject?: string;
}

// Extensible registry for future custom modules
export type CustomModuleHandler = (
  payload: any,
  context: JarvisCockpitContext
) => Promise<string | void> | (string | void);

class JarvisRegistry {
  private customHandlers: Map<string, CustomModuleHandler> = new Map();

  /** Register a custom module action handler for future additions */
  public registerModule(moduleName: string, handler: CustomModuleHandler) {
    this.customHandlers.set(moduleName.toLowerCase(), handler);
  }

  public getModuleHandler(moduleName: string): CustomModuleHandler | undefined {
    return this.customHandlers.get(moduleName.toLowerCase());
  }
}

export const jarvisRegistry = new JarvisRegistry();

/**
 * Fast-path client-side NLP intent parser for instantaneous screen/cockpit actions.
 * If no local rule matches, returns null to allow backend AI intelligence fallback.
 */
export function parseLocalJarvisCommand(spokenText: string): JarvisActionPayload | null {
  if (!spokenText) return null;
  const s = spokenText.toLowerCase().trim();

  // 1. Window / App Controls
  if (s.includes("open youtube") || s.includes("play youtube") || s.includes("start youtube") || s.includes("show youtube")) {
    return { type: "open_app", app: "youtube" };
  }
  if (s.includes("close youtube") || s.includes("hide youtube") || s.includes("stop youtube")) {
    return { type: "close_app", app: "youtube" };
  }

  if (s.includes("open spotify") || s.includes("play spotify") || s.includes("start spotify") || s.includes("show spotify") || s.includes("play music")) {
    return { type: "open_app", app: "spotify" };
  }
  if (s.includes("close spotify") || s.includes("hide spotify") || s.includes("stop spotify") || s.includes("stop music")) {
    return { type: "close_app", app: "spotify" };
  }

  if (s.includes("open browser") || s.includes("launch browser") || s.includes("show browser") || s.includes("open web")) {
    return { type: "open_app", app: "browser" };
  }
  if (s.includes("close browser") || s.includes("hide browser")) {
    return { type: "close_app", app: "browser" };
  }

  if (s.includes("open note") || s.includes("show note") || s.includes("open my notes") || s.includes("show notes") || s.includes("open ideas")) {
    return { type: "open_app", app: "notes" };
  }
  if (s.includes("close note") || s.includes("hide note") || s.includes("close notes")) {
    return { type: "close_app", app: "notes" };
  }

  if (s.includes("open workspace") || s.includes("show tasks") || s.includes("open planner") || s.includes("show planner") || s.includes("open tasks")) {
    return { type: "open_app", app: "workspace" };
  }
  if (s.includes("close workspace") || s.includes("hide workspace") || s.includes("close planner") || s.includes("hide tasks")) {
    return { type: "close_app", app: "workspace" };
  }

  if (s.includes("open settings") || s.includes("change wallpaper") || s.includes("open wallpapers") || s.includes("show wallpapers")) {
    return { type: "open_app", app: "settings" };
  }
  if (s.includes("close settings") || s.includes("hide settings")) {
    return { type: "close_app", app: "settings" };
  }

  // 2. Timer Controls
  if (s.includes("start timer") || s.includes("start pomodoro") || s.includes("resume timer") || s.includes("begin focus") || s.includes("start sprint")) {
    return { type: "start_timer" };
  }
  if (s.includes("pause timer") || s.includes("stop timer") || s.includes("freeze timer") || s.includes("pause sprint")) {
    return { type: "pause_timer" };
  }
  if (s.includes("reset timer") || s.includes("restart timer")) {
    return { type: "reset_timer" };
  }
  if (s.includes("short break") || s.includes("take a break") || s.includes("take break")) {
    return { type: "set_timer_mode", mode: "shortBreak" };
  }
  if (s.includes("long break")) {
    return { type: "set_timer_mode", mode: "longBreak" };
  }
  if (s.includes("focus mode") || s.includes("deep work mode") || s.includes("study mode")) {
    return { type: "set_timer_mode", mode: "focus" };
  }

  // Regex check for: "set timer to 45 minutes" / "timer 25 mins"
  const timerMatch = s.match(/(?:set\s+timer\s+to|timer\s+to|timer\s+for)\s+(\d+)\s*(?:min|mins|minutes)?/i);
  if (timerMatch && timerMatch[1]) {
    const mins = parseInt(timerMatch[1], 10);
    if (!isNaN(mins) && mins > 0 && mins <= 240) {
      return { type: "set_timer_duration", duration: mins };
    }
  }

  // 3. Take Note / Save Idea
  if (
    s.includes("take a note") ||
    s.includes("note down") ||
    s.includes("write a note") ||
    s.includes("save an idea") ||
    s.includes("save idea") ||
    s.includes("add a note") ||
    s.includes("remember this") ||
    s.includes("make a note")
  ) {
    let clean = s.replace(/^(jarvis\s*,?\s*|hey jarvis\s*,?\s*|please\s*)/i, "");
    clean = clean.replace(
      /^(take a note\s*(that|about|:|to)?|note down\s*(that|about|:|to)?|write a note\s*(that|about|:|to)?|save an idea\s*(that|about|:|to)?|save idea\s*(that|about|:|to)?|add a note\s*(that|about|:|to)?|remember this\s*(that|about|:|to)?|make a note\s*(that|about|:|to)?)\s*/i,
      ""
    ).trim();

    if (clean) {
      const words = clean.split(" ");
      const title = words.slice(0, 4).join(" ");
      return {
        type: "create_note",
        note: {
          title: title.charAt(0).toUpperCase() + title.slice(1),
          content: clean.charAt(0).toUpperCase() + clean.slice(1),
          category: "ideas",
        },
      };
    }
  }

  // 4. Wallpaper Switch
  const wallMatch = s.match(/(?:change|switch|set)\s+(?:the\s+)?wallpaper\s+to\s+([a-z\s]+)/i);
  if (wallMatch && wallMatch[1]) {
    return { type: "change_wallpaper", wallpaper: wallMatch[1].trim() };
  }

  return null;
}

/**
 * Executes a parsed action payload across the Cockpit screen
 * Returns a spoken voice confirmation text for JARVIS to vocalize.
 */
export async function executeJarvisCockpitAction(
  action: JarvisActionPayload,
  ctx: JarvisCockpitContext
): Promise<string> {
  switch (action.type) {
    case "open_app":
    case "open_youtube":
    case "open_spotify":
    case "open_browser":
    case "open_notes":
    case "open_workspace":
    case "open_settings": {
      const app = action.app || (action.type.replace("open_", "") as JarvisAppId);
      ctx.openApp(app);
      const names: Record<JarvisAppId, string> = {
        youtube: "YouTube player",
        spotify: "Spotify music",
        browser: "Web browser",
        notes: "Notes board",
        workspace: "Workspace and planner",
        settings: "Wallpapers and settings",
      };
      return `Opening ${names[app] || "window"}, sir.`;
    }

    case "close_app":
    case "close_youtube":
    case "close_spotify":
    case "close_browser":
    case "close_notes":
    case "close_workspace":
    case "close_settings": {
      const app = action.app || (action.type.replace("close_", "") as JarvisAppId);
      ctx.closeApp(app);
      return `Window closed, sir.`;
    }

    case "start_timer": {
      ctx.startTimer();
      return "Starting your focus timer now, sir.";
    }

    case "pause_timer": {
      ctx.pauseTimer();
      return "Timer paused, sir.";
    }

    case "reset_timer": {
      ctx.resetTimer();
      return "Timer has been reset.";
    }

    case "set_timer_mode": {
      if (action.mode) {
        ctx.setTimerMode(action.mode);
        const modeNames = {
          focus: "Focus session",
          shortBreak: "Short break",
          longBreak: "Long break",
        };
        return `Switched to ${modeNames[action.mode]}, sir.`;
      }
      return "Timer mode updated.";
    }

    case "set_timer_duration": {
      if (action.duration) {
        ctx.setTimerMinutes(action.duration);
        return `Timer set to ${action.duration} minutes.`;
      }
      return "Timer duration updated.";
    }

    case "create_note": {
      if (action.note) {
        await ctx.createNote(action.note);
        ctx.openApp("notes");
        return `I have saved that note to your ideas board, sir.`;
      }
      return "Note recorded.";
    }

    case "change_wallpaper": {
      if (action.wallpaper) {
        const ok = ctx.setWallpaperByTheme(action.wallpaper);
        if (ok) return `Switched wallpaper to ${action.wallpaper}.`;
        return `Wallpaper updated, sir.`;
      }
      return "Wallpaper updated.";
    }

    case "custom_module_action": {
      if (action.customId) {
        const handler = jarvisRegistry.getModuleHandler(action.customId);
        if (handler) {
          const res = await handler(action.customData, ctx);
          return res || "Custom module command executed.";
        }
      }
      return "Command executed, sir.";
    }

    default:
      return "Command recognized.";
  }
}
