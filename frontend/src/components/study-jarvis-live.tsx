import { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Bot,
  Zap,
  Check,
  X,
  Move,
  FileText,
  Youtube,
  Radio,
  Globe,
  Sliders,
  Play,
  Pause,
  RotateCcw,
  Minimize2,
  Maximize2,
  Square,
  BrainCircuit,
  Cpu
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { askJarvis } from "@/lib/api";
import {
  parseLocalJarvisCommand,
  executeJarvisCockpitAction,
  generateClientJarvisIntelligence,
  type JarvisCockpitContext,
  type JarvisActionPayload,
} from "@/lib/jarvis-actions";

interface StudyJarvisLiveProps {
  userId: string | number;
  subject?: string;
  cockpitContext: JarvisCockpitContext;
  pos?: { x: number; y: number };
  onPosChange?: (pos: { x: number; y: number }) => void;
  zIndex?: number;
  onFocus?: () => void;
}

export function StudyJarvisLive({
  userId,
  subject = "General Study",
  cockpitContext,
  pos = { x: 40, y: 120 },
  onPosChange,
  zIndex = 50,
  onFocus,
}: StudyJarvisLiveProps) {
  // Voice & Copilot State
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [expandedHUD, setExpandedHUD] = useState(true);
  const [speechSupported, setSpeechSupported] = useState(true);

  // Active Multi-Agent & Memory Swarm State
  const [activeAgent, setActiveAgent] = useState<{ id: string; name: string; category: string }>({
    id: "chief_jarvis",
    name: "Chief J.A.R.V.I.S.",
    category: "Core AI Commander"
  });
  const [memoriesCount, setMemoriesCount] = useState<number>(0);

  // Transcript & Dialogue State
  const [liveTranscript, setLiveTranscript] = useState("");
  const [lastSpeech, setLastSpeech] = useState<string>("Jarvis online. Standing by for voice commands, sir.");
  const [lastActionTag, setLastActionTag] = useState<string | null>(null);

  // Movable Floating Button Position
  const [windowPos, setWindowPos] = useState(pos);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 });

  // References for Stable Dynamic Context, Acoustic Shield & Memory
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const subjectRef = useRef(subject);
  subjectRef.current = subject;

  const cockpitContextRef = useRef(cockpitContext);
  cockpitContextRef.current = cockpitContext;

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const isProcessingRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const echoCooldownTimerRef = useRef<any>(null);
  const recentSpokenTextsRef = useRef<{ text: string; timestamp: number }[]>([]);
  const conversationHistoryRef = useRef<Array<{ role: string; content: string }>>([]);

  useEffect(() => {
    setWindowPos(pos);
  }, [pos.x, pos.y]);

  // Stop Speaking / Interrupt TTS & Clear Acoustic Shield
  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (echoCooldownTimerRef.current) {
      clearTimeout(echoCooldownTimerRef.current);
    }
    isSpeakingRef.current = false;
    setIsSpeaking(false);
    setLiveTranscript("");
  }, []);

  // Natural TTS Voice with Acoustic Shield & Speaker Echo Cancellation
  const speakJarvis = useCallback((textToSpeak: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    try {
      window.speechSynthesis.cancel();
      if (echoCooldownTimerRef.current) {
        clearTimeout(echoCooldownTimerRef.current);
      }

      const clean = textToSpeak.replace(/<[^>]*>?/gm, "").replace(/[`*#_]/g, "").trim();
      if (!clean) return;

      // 1. Record spoken text to cancel any acoustic echoes
      recentSpokenTextsRef.current.push({ text: clean, timestamp: Date.now() });
      if (recentSpokenTextsRef.current.length > 15) {
        recentSpokenTextsRef.current.shift();
      }

      // 2. Lock microphone recognition immediately
      isSpeakingRef.current = true;
      setIsSpeaking(true);
      setLiveTranscript("");

      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.08;
      utterance.pitch = 0.98; // Refined British-style AI tone

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice =
        voices.find((v) => v.lang.includes("en-GB") || (v.name.includes("Daniel") || v.name.includes("Oliver") || v.name.includes("Arthur") || v.name.includes("George"))) ||
        voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Siri"))) ||
        voices[0];

      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.onstart = () => {
        isSpeakingRef.current = true;
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        // Keep acoustic echo suppression active for 850ms to let room reverb and mic buffer clear
        if (echoCooldownTimerRef.current) clearTimeout(echoCooldownTimerRef.current);
        echoCooldownTimerRef.current = setTimeout(() => {
          isSpeakingRef.current = false;
          setLiveTranscript("");
        }, 850);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("TTS error:", err);
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    }
  }, []);

  // Process Voice Query / Command
  const processVoiceInput = useCallback(
    async (spokenQuery: string) => {
      const q = spokenQuery.trim();
      if (!q || isProcessingRef.current || isSpeakingRef.current) return;

      // Acoustic Echo Cancellation: check if the recognized phrase is JARVIS's own speech
      const cleanQ = q.toLowerCase().replace(/[^a-z0-9]/g, " ").trim();
      if (!cleanQ || cleanQ.length < 2) return;

      const now = Date.now();
      const isEcho = recentSpokenTextsRef.current.some((item) => {
        if (now - item.timestamp > 15000) return false;
        const cleanSpoken = item.text.toLowerCase().replace(/[^a-z0-9]/g, " ").trim();

        // Exact substring match
        if (cleanSpoken.includes(cleanQ) || cleanQ.includes(cleanSpoken)) {
          return true;
        }

        // Token overlap similarity (e.g. if mic misrecognized 1-2 words of JARVIS's sentence)
        const qTokens = cleanQ.split(/\s+/).filter((w) => w.length >= 3);
        const spokenTokens = new Set(cleanSpoken.split(/\s+/).filter((w) => w.length >= 3));
        if (qTokens.length > 0 && spokenTokens.size > 0) {
          let matched = 0;
          for (const tok of qTokens) {
            if (spokenTokens.has(tok)) matched++;
          }
          if (matched / Math.min(qTokens.length, spokenTokens.size) >= 0.55) {
            return true;
          }
        }
        return false;
      });

      if (isEcho) {
        setLiveTranscript("");
        return;
      }

      stopSpeaking();
      isProcessingRef.current = true;
      setIsThinking(true);
      setLiveTranscript("");

      const currentContext = cockpitContextRef.current;
      const currentSubject = subjectRef.current;
      const currentUserId = userIdRef.current;

      try {
        // 1. Check local high-speed screen/timer/note actions first
        const localAction = parseLocalJarvisCommand(q);
        if (localAction && currentContext) {
          const confirmationText = await executeJarvisCockpitAction(localAction, currentContext);
          setLastSpeech(confirmationText);
          setLastActionTag(localAction.type.replace("_", " ").toUpperCase());
          speakJarvis(confirmationText);
          conversationHistoryRef.current.push({ role: "user", content: q });
          conversationHistoryRef.current.push({ role: "assistant", content: confirmationText });
          return;
        }

        // 2. Call backend 100-Agent Swarm Orchestrator with Long-Term Memory
        let replyText = "";
        let agentProfile: { id: string; name: string; category: string } | null = null;
        let memoryCount: number | undefined = undefined;

        try {
          const res = await askJarvis({
            user_id: currentUserId,
            prompt: q,
            subject: currentSubject,
            history: conversationHistoryRef.current.slice(-4),
            cockpit_context: {
              subject: currentSubject,
              isTimerRunning: currentContext?.isTimerRunning,
              timerMode: currentContext?.timerMode,
            },
          });

          if (res?.text) {
            replyText = res.text;
            if (res.agent) agentProfile = res.agent;
            if (res.memories_count !== undefined) memoryCount = res.memories_count;

            if (res.action && typeof res.action === "object" && currentContext) {
              const actionPayload = res.action as JarvisActionPayload;
              await executeJarvisCockpitAction(actionPayload, currentContext);
              setLastActionTag(actionPayload.type.replace("_", " ").toUpperCase());
            } else {
              setLastActionTag(null);
            }
          }
        } catch (apiErr) {
          console.warn("Jarvis API call fallback to 100-Agent client swarm:", apiErr);
        }

        // 3. If backend was unreachable or delayed, generate 100-Agent Swarm Intelligence on client
        if (!replyText) {
          const clientIntel = generateClientJarvisIntelligence(q, currentSubject, {
            isTimerRunning: currentContext?.isTimerRunning,
            timerMode: currentContext?.timerMode,
            secondsLeft: currentContext?.secondsLeft,
          });
          replyText = clientIntel.text;
          agentProfile = clientIntel.agent;
          setLastActionTag(null);
        }

        setLastSpeech(replyText);
        if (agentProfile) setActiveAgent(agentProfile);
        if (memoryCount !== undefined) setMemoriesCount(memoryCount);

        conversationHistoryRef.current.push({ role: "user", content: q });
        conversationHistoryRef.current.push({ role: "assistant", content: replyText });
        if (conversationHistoryRef.current.length > 10) {
          conversationHistoryRef.current = conversationHistoryRef.current.slice(-10);
        }

        speakJarvis(replyText);
      } catch (err) {
        console.error("Jarvis voice processing error:", err);
        const clientIntel = generateClientJarvisIntelligence(q, currentSubject);
        setLastSpeech(clientIntel.text);
        setActiveAgent(clientIntel.agent);
        speakJarvis(clientIntel.text);
      } finally {
        setIsThinking(false);
        isProcessingRef.current = false;
      }
    },
    [speakJarvis, stopSpeaking]
  );

  // Speech Recognition Continuous Loop with Acoustic Shield Guard
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    let recognition: any = null;

    const startRecognition = () => {
      if (isMuted) {
        setIsListening(false);
        return;
      }

      try {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          // Acoustic Shield: Drop all audio frames picked up while JARVIS is speaking
          if (isSpeakingRef.current) {
            return;
          }

          let interim = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const part = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += part + " ";
            } else {
              interim += part;
            }
          }

          const current = (finalTranscript + interim).trim();
          if (current) {
            setLiveTranscript(current);

            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
              if (current.length >= 2) {
                processVoiceInput(current);
              }
            }, 1100);
          }
        };

        recognition.onerror = (event: any) => {
          if (event.error !== "no-speech" && event.error !== "aborted") {
            console.warn("Jarvis mic error:", event.error);
          }
        };

        recognition.onend = () => {
          if (!isMuted) {
            try {
              recognition.start();
            } catch {}
          } else {
            setIsListening(false);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.warn("Could not start Jarvis mic loop:", err);
      }
    };

    startRecognition();

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (echoCooldownTimerRef.current) clearTimeout(echoCooldownTimerRef.current);
      if (recognition) {
        try {
          recognition.onend = null;
          recognition.stop();
        } catch {}
      }
    };
  }, [isMuted, processVoiceInput]);

  // Toggle Mute / Unmute or Interrupt Active Speech
  const toggleMute = () => {
    // If JARVIS is speaking, clicking immediately silences it (barge-in / interrupt)
    if (isSpeaking) {
      stopSpeaking();
      toast.info("JARVIS Speech Stopped");
      return;
    }

    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (nextMuted) {
      stopSpeaking();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      setLastSpeech("Microphone muted. Jarvis is on standby.");
      toast.info("JARVIS Microphone Muted");
    } else {
      setLastSpeech("Jarvis online. Standing by for your commands, sir.");
      speakJarvis("Jarvis online. Standing by, sir.");
      toast.success("JARVIS Listening Live");
    }
  };

  // Dragging Handlers
  const currentPosRef = useRef(windowPos);
  currentPosRef.current = windowPos;

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, input, a")) return;
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
      const newX = Math.max(10, Math.min(window.innerWidth - 320, dragStartRef.current.posX + dx));
      const newY = Math.max(40, Math.min(window.innerHeight - 150, dragStartRef.current.posY + dy));
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
  }, [isDragging, onPosChange]);

  return (
    <div
      onMouseDownCapture={onFocus}
      style={{ left: `${windowPos.x}px`, top: `${windowPos.y}px`, zIndex }}
      className="fixed flex items-center gap-2 select-none font-sans transition-shadow"
    >
      {/* 1. Small Animated Arc Reactor Mic Button */}
      <div className="relative group flex items-center justify-center">
        {/* Glowing Outer Rings */}
        {!isMuted && isListening && (
          <div className="absolute -inset-2 rounded-full bg-cyan-500/20 blur-md animate-pulse" />
        )}
        {!isMuted && isSpeaking && (
          <div className="absolute -inset-2.5 rounded-full bg-emerald-500/30 blur-lg animate-ping" />
        )}
        {!isMuted && isThinking && (
          <div className="absolute -inset-2 rounded-full bg-amber-500/20 blur-md animate-spin" />
        )}

        <button
          type="button"
          onClick={toggleMute}
          className={`relative w-12 h-12 rounded-full flex flex-col items-center justify-center transition-all shadow-xl border ${
            isMuted
              ? "bg-zinc-900 border-red-500/40 text-red-400 shadow-red-950/40"
              : isSpeaking
              ? "bg-gradient-to-tr from-emerald-950 via-zinc-900 to-cyan-950 border-emerald-400 text-emerald-300 shadow-emerald-950/60 scale-105"
              : isThinking
              ? "bg-gradient-to-tr from-amber-950 via-zinc-900 to-indigo-950 border-amber-400 text-amber-300 shadow-amber-950/60"
              : "bg-gradient-to-tr from-cyan-950 via-zinc-900 to-purple-950 border-cyan-400/80 text-cyan-300 shadow-cyan-950/60 hover:scale-105"
          }`}
          title={
            isSpeaking
              ? "Click to Stop Speaking (Interrupt)"
              : isMuted
              ? "Click to Unmute JARVIS"
              : "Click to Mute JARVIS"
          }
        >
          {/* Animated Core Icon */}
          {isMuted ? (
            <MicOff className="h-5 w-5" />
          ) : isSpeaking ? (
            <div className="flex items-center gap-0.5 h-5">
              <span className="w-1 h-3 bg-emerald-400 rounded-full animate-pulse" />
              <span className="w-1 h-5 bg-emerald-300 rounded-full animate-bounce" />
              <span className="w-1 h-2 bg-emerald-400 rounded-full animate-pulse" />
            </div>
          ) : isThinking ? (
            <Sparkles className="h-5 w-5 animate-spin" />
          ) : (
            <Mic className="h-5 w-5 animate-pulse" />
          )}

          {/* Miniature Status Dot */}
          <span
            className={`absolute bottom-0.5 w-1.5 h-1.5 rounded-full ${
              isMuted ? "bg-red-500" : isSpeaking ? "bg-emerald-400" : "bg-cyan-400"
            }`}
          />
        </button>
      </div>

      {/* 2. Floating Compact Capsule HUD */}
      {expandedHUD && (
        <div
          onMouseDown={handleMouseDown}
          className="w-[290px] bg-zinc-950/90 backdrop-blur-xl border border-white/15 rounded-2xl p-2.5 shadow-2xl text-white space-y-1.5 cursor-move"
        >
          {/* Top Pill Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[11px] tracking-wider text-cyan-400 font-mono">
                J.A.R.V.I.S.
              </span>
              <Badge
                variant="outline"
                className={`text-[8px] py-0 px-1 border-white/10 ${
                  isMuted ? "text-red-400 border-red-500/30" : isSpeaking ? "text-emerald-300 border-emerald-500/40" : "text-cyan-300"
                }`}
              >
                {isMuted ? "MUTED" : isSpeaking ? "SPEAKING" : isThinking ? "THINKING" : "LISTENING"}
              </Badge>
              {isSpeaking && (
                <button
                  type="button"
                  onClick={stopSpeaking}
                  className="flex items-center gap-0.5 text-[8px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/40 transition-colors"
                  title="Interrupt Speech"
                >
                  <Square className="w-2 h-2 fill-current" />
                  <span>Stop</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1">
              {lastActionTag && (
                <span className="text-[8px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                  {lastActionTag}
                </span>
              )}
              <button
                type="button"
                onClick={() => setExpandedHUD(false)}
                className="p-1 text-white/40 hover:text-white rounded"
                title="Collapse HUD"
              >
                <Minimize2 className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Active 100-Agent Swarm Specialist Badge & Memory Counter */}
          <div className="flex items-center justify-between text-[9px] px-1 text-cyan-300/90 font-mono border-b border-white/5 pb-1">
            <span className="flex items-center gap-1 truncate max-w-[170px]" title={activeAgent.name}>
              <BrainCircuit className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
              <span className="truncate font-medium">{activeAgent.name}</span>
            </span>
            <span
              className="text-[8px] px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 shrink-0 flex items-center gap-0.5"
              title="Persistent Long-Term Memory Synced to MongoDB"
            >
              <Cpu className="w-2 h-2" />
              <span>{memoriesCount > 0 ? `${memoriesCount} memory facts` : "Memory synced"}</span>
            </span>
          </div>

          {/* Live Transcript / Speech Display */}
          <div className="text-[11px] text-white/90 leading-snug bg-zinc-900/60 p-2 rounded-xl border border-white/5 min-h-[38px] flex items-center">
            {liveTranscript ? (
              <p className="text-cyan-200 italic line-clamp-2">"{liveTranscript}"</p>
            ) : (
              <p className="text-white/80 line-clamp-2">{lastSpeech}</p>
            )}
          </div>

          {/* Quick Voice Hints */}
          <div className="text-[9px] text-white/40 flex items-center justify-between px-1">
            <span>Say: "Explain calculus...", "Take a note..."</span>
            <span className="font-mono text-cyan-400/80">100 Agents</span>
          </div>
        </div>
      )}

      {/* Collapsed Expand Dot */}
      {!expandedHUD && (
        <button
          type="button"
          onClick={() => setExpandedHUD(true)}
          className="px-2 py-1 rounded-lg bg-zinc-950/80 border border-white/15 text-[10px] text-cyan-300 hover:text-white"
        >
          JARVIS HUD
        </button>
      )}
    </div>
  );
}
