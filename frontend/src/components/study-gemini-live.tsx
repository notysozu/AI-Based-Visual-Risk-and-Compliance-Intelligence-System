import { useState, useEffect, useRef, useCallback } from "react";
import {
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RotateCcw,
  Maximize2,
  Minimize2,
  Move,
  X,
  Bot,
  Brain,
  MessageSquare,
  HelpCircle,
  Zap,
  BookOpen,
  Clock,
  Flame,
  Award,
  Radio,
  Sliders
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { askGeminiLive } from "@/lib/api";

export interface LiveTurn {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

interface StudyGeminiLiveProps {
  open: boolean;
  onClose: () => void;
  userId: string | number;
  subject?: string;
  activeTaskTitle?: string;
  secondsLeft?: number;
  timerMode?: "focus" | "shortBreak" | "longBreak";
  pos?: { x: number; y: number };
  onPosChange?: (pos: { x: number; y: number }) => void;
}

export function StudyGeminiLive({
  open,
  onClose,
  userId,
  subject = "General Study",
  activeTaskTitle,
  secondsLeft,
  timerMode = "focus",
  pos = { x: 380, y: 70 },
  onPosChange,
}: StudyGeminiLiveProps) {
  // Voice & AI State
  const [isMicActive, setIsMicActive] = useState(true);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [audioVoiceEnabled, setAudioVoiceEnabled] = useState(true);
  const [speechRate, setSpeechRate] = useState<number>(1.1);

  // Live Transcripts & History
  const [liveTranscript, setLiveTranscript] = useState("");
  const [latestResponse, setLatestResponse] = useState<string>(
    "Gemini Live is active. Speak any study question, ask for a formula, or say 'Quiz me'."
  );
  const [history, setHistory] = useState<LiveTurn[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [copied, setCopied] = useState(false);

  // Speech Recognition & Silence Debounce Refs
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const isQueryProcessingRef = useRef(false);
  const speechHistoryRef = useRef<LiveTurn[]>([]);

  // Movable Window State
  const [windowPos, setWindowPos] = useState(pos);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 });

  useEffect(() => {
    setWindowPos(pos);
  }, [pos.x, pos.y]);

  useEffect(() => {
    speechHistoryRef.current = history;
  }, [history]);

  // Natural TTS Speech Synthesis
  const speakText = useCallback(
    (textToSpeak: string) => {
      if (!audioVoiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;

      try {
        window.speechSynthesis.cancel(); // Stop any pending speech

        // Clean out brackets or code marks for natural sound
        const clean = textToSpeak.replace(/<[^>]*>?/gm, "").replace(/[`*#_]/g, "").trim();
        if (!clean) return;

        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.rate = speechRate;
        utterance.pitch = 1.0;

        // Try to select high-quality English voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice =
          voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Siri") || v.name.includes("Samantha"))) ||
          voices.find((v) => v.lang.startsWith("en")) ||
          voices[0];

        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onstart = () => setIsAiSpeaking(true);
        utterance.onend = () => setIsAiSpeaking(false);
        utterance.onerror = () => setIsAiSpeaking(false);

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn("TTS error:", err);
        setIsAiSpeaking(false);
      }
    },
    [audioVoiceEnabled, speechRate]
  );

  // Stop TTS immediately on barge-in / user speech
  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsAiSpeaking(false);
    }
  }, []);

  // Send voice query to backend
  const sendQuery = useCallback(
    async (queryText: string) => {
      if (!queryText.trim() || isQueryProcessingRef.current) return;

      // Barge-in: cut off any current TTS audio
      stopSpeaking();

      isQueryProcessingRef.current = true;
      setIsThinking(true);
      const userPrompt = queryText.trim();
      setLiveTranscript("");

      const userTurn: LiveTurn = {
        id: `usr-${Date.now()}`,
        role: "user",
        text: userPrompt,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setHistory((prev) => [...prev, userTurn]);

      try {
        const res = await askGeminiLive({
          user_id: userId,
          prompt: userPrompt,
          subject,
          active_task: activeTaskTitle,
          history: speechHistoryRef.current.slice(-4).map((h) => ({
            role: h.role,
            content: h.text,
          })),
        });

        const reply = res.text || "I'm ready for your next question.";
        setLatestResponse(reply);

        const aiTurn: LiveTurn = {
          id: `asst-${Date.now()}`,
          role: "assistant",
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setHistory((prev) => [...prev, aiTurn]);

        // Speak aloud
        speakText(reply);
      } catch (err: any) {
        console.error("Gemini Live error:", err);
        const errMsg = "I had trouble processing that. Please ask again.";
        setLatestResponse(errMsg);
        speakText(errMsg);
      } finally {
        setIsThinking(false);
        isQueryProcessingRef.current = false;
      }
    },
    [userId, subject, activeTaskTitle, speakText, stopSpeaking]
  );

  // Always-Live Continuous Speech Recognition Hook
  useEffect(() => {
    if (!open || !isMicActive || typeof window === "undefined") {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Speech recognition not supported in this browser. Use Chrome, Edge, or Safari.");
      return;
    }

    let recognition: any = null;

    const startRecognition = () => {
      try {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          // Barge-in: user is speaking, stop AI speech
          stopSpeaking();

          let interim = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const part = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += part;
            } else {
              interim += part;
            }
          }

          const currentSpoken = (finalTranscript || interim).trim();
          if (currentSpoken) {
            setLiveTranscript(currentSpoken);

            // Silence debounce timer (~1.2s of silence dispatches the query automatically)
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
              if (currentSpoken.length >= 2) {
                sendQuery(currentSpoken);
              }
            }, 1200);
          }
        };

        recognition.onerror = (event: any) => {
          if (event.error !== "no-speech" && event.error !== "aborted") {
            console.warn("Speech error:", event.error);
          }
        };

        recognition.onend = () => {
          // Auto-restart loop to keep listening live in Study Mode
          if (isMicActive && open) {
            try {
              recognition.start();
            } catch {}
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.warn("Could not start continuous speech recognition:", err);
      }
    };

    startRecognition();

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognition) {
        try {
          recognition.onend = null;
          recognition.stop();
        } catch {}
      }
    };
  }, [open, isMicActive, sendQuery, stopSpeaking]);

  // Copy reply to clipboard
  const handleCopy = () => {
    if (!latestResponse) return;
    navigator.clipboard.writeText(latestResponse);
    setCopied(true);
    toast.success("Copied Gemini response");
    setTimeout(() => setCopied(false), 2000);
  };

  // Quick Prompt Trigger
  const handleQuickPrompt = (promptText: string) => {
    sendQuery(promptText);
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

  // Determine current orb state
  let orbState = "idle";
  if (isThinking) orbState = "thinking";
  else if (isAiSpeaking) orbState = "speaking";
  else if (isMicActive) orbState = "listening";

  return (
    <div
      style={{
        left: `${windowPos.x}px`,
        top: `${windowPos.y}px`,
        width: isCompact ? "320px" : "390px",
      }}
      className="fixed z-35 rounded-3xl border border-purple-500/30 bg-black/45 backdrop-blur-3xl shadow-[0_12px_40px_rgba(168,85,247,0.25)] flex flex-col overflow-hidden select-none transition-all duration-200"
    >
      {/* 1. Header Bar with macOS Minimize Dot */}
      <div
        onMouseDown={handleMouseDown}
        className="cursor-grab active:cursor-grabbing flex items-center justify-between px-3.5 py-2.5 border-b border-white/10 bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-black/40 group"
      >
        <div className="flex items-center gap-2">
          {/* Green minimize dot */}
          <button
            type="button"
            onClick={onClose}
            className="w-3 h-3 rounded-full bg-emerald-500 hover:bg-emerald-400 transition-colors shadow-sm flex items-center justify-center group"
            title="Hide Gemini Live"
          >
            <span className="opacity-0 group-hover:opacity-100 text-[8px] text-black font-bold">−</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
            <span>Gemini Live Voice AI</span>
          </div>

          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-purple-500/40 text-purple-300 font-mono">
            Always Live
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          {/* Audio Output Toggle */}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              setAudioVoiceEnabled(!audioVoiceEnabled);
              if (audioVoiceEnabled) stopSpeaking();
              toast.info(audioVoiceEnabled ? "Voice audio muted" : "Voice audio enabled");
            }}
            className={`h-6 w-6 rounded-md ${audioVoiceEnabled ? "text-purple-300 hover:text-white" : "text-white/40 hover:text-white"} hover:bg-white/10`}
            title={audioVoiceEnabled ? "Mute Voice Speech" : "Enable Voice Speech"}
          >
            {audioVoiceEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
          </Button>

          {/* Compact toggle */}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsCompact(!isCompact)}
            className="h-6 w-6 text-white/60 hover:text-white hover:bg-white/10 rounded-md"
            title={isCompact ? "Expand Window" : "Compact HUD Mode"}
          >
            {isCompact ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="h-6 w-6 text-white/60 hover:text-red-400 hover:bg-white/10 rounded-md"
            title="Close"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* 2. Gemini Live Holographic Aurora Orb Center */}
      <div className="p-4 flex flex-col items-center justify-center text-center relative overflow-hidden bg-gradient-to-b from-transparent via-purple-950/10 to-black/30 border-b border-white/10">
        {/* Animated Glow Halo */}
        <div
          className={`absolute w-32 h-32 rounded-full blur-2xl transition-all duration-700 pointer-events-none ${
            orbState === "thinking"
              ? "bg-purple-600/40 animate-pulse scale-125"
              : orbState === "speaking"
              ? "bg-emerald-500/35 animate-ping scale-110"
              : orbState === "listening"
              ? "bg-cyan-500/30 animate-pulse"
              : "bg-purple-500/15"
          }`}
        />

        {/* Central Glowing Orb */}
        <div className="relative z-10 my-1">
          <button
            type="button"
            onClick={() => {
              setIsMicActive(!isMicActive);
              if (isMicActive) stopSpeaking();
              toast.info(!isMicActive ? "Gemini Live Listening" : "Microphone Muted");
            }}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 shadow-xl border ${
              orbState === "thinking"
                ? "bg-gradient-to-tr from-purple-600 via-indigo-500 to-pink-500 border-purple-300 shadow-[0_0_25px_rgba(168,85,247,0.6)] animate-spin"
                : orbState === "speaking"
                ? "bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 border-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.6)] scale-105"
                : isMicActive
                ? "bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 border-cyan-300/80 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-105"
                : "bg-zinc-900 border-white/20 text-white/40 shadow-inner"
            }`}
            title={isMicActive ? "Click to Mute Mic" : "Click to Enable Live Mic"}
          >
            {orbState === "thinking" ? (
              <Sparkles className="h-8 w-8 text-white animate-spin" />
            ) : orbState === "speaking" ? (
              <Volume2 className="h-8 w-8 text-white animate-bounce" />
            ) : isMicActive ? (
              <Mic className="h-8 w-8 text-white drop-shadow-md" />
            ) : (
              <MicOff className="h-8 w-8 text-white/50" />
            )}
          </button>
        </div>

        {/* Live Status Label & Audio Waveform Bars */}
        <div className="mt-2 space-y-1 z-10">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold">
            {orbState === "thinking" ? (
              <span className="text-purple-300 flex items-center gap-1">
                <Sparkles className="h-3 w-3 animate-spin" /> Synthesizing answer...
              </span>
            ) : orbState === "speaking" ? (
              <span className="text-emerald-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Gemini speaking...
              </span>
            ) : isMicActive ? (
              <span className="text-cyan-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Listening live · Speak freely
              </span>
            ) : (
              <span className="text-white/40">Mic muted · Click orb to start</span>
            )}
          </div>

          <p className="text-[10px] text-white/50 font-mono">
            {subject} {activeTaskTitle ? `· ${activeTaskTitle}` : ""}
          </p>
        </div>

        {/* User Real-Time Transcription Bubble */}
        {liveTranscript && (
          <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-xs text-cyan-200 max-w-full truncate shadow-md animate-pulse">
            <span className="text-[10px] uppercase font-bold text-cyan-400 mr-1.5">You:</span>
            <span>"{liveTranscript}"</span>
          </div>
        )}
      </div>

      {/* 3. Latest Response & Playback Area */}
      <div className="p-3.5 space-y-2.5 bg-black/30">
        <div className="flex items-center justify-between text-[11px] text-white/60">
          <span className="flex items-center gap-1 font-semibold text-purple-300">
            <Bot className="h-3.5 w-3.5 text-purple-400" />
            <span>Gemini Response</span>
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => speakText(latestResponse)}
              className="text-white/60 hover:text-purple-300 p-1 rounded"
              title="Replay Audio"
            >
              <RotateCcw className="h-3 w-3" />
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="text-white/60 hover:text-white p-1 rounded"
              title="Copy text"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-white/90 leading-relaxed font-sans shadow-inner selection:bg-purple-500 selection:text-white">
          {latestResponse}
        </div>

        {/* 4. Quick Suggested Voice Prompts */}
        {!isCompact && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider block">
              Instant Prompts:
            </span>
            <div className="flex gap-1.5 flex-wrap">
              {[
                { label: "Quiz me on this", query: `Quiz me with 1 active recall question for ${subject}` },
                { label: "Key formula", query: `Give me the key formula and rule for ${subject}` },
                { label: "Mnemonic hook", query: `Give me a quick mnemonic to remember this in ${subject}` },
                { label: "Explain simply", query: `Explain this concept in simple 2 sentences` },
                { label: "Sprint Motivation", query: `Give me a 1-sentence high-energy study motivation quote` },
              ].map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => handleQuickPrompt(chip.query)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-purple-600/30 hover:border-purple-500/40 text-[10px] text-white/80 hover:text-white font-medium transition-all"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 5. Session History Accordion */}
        {history.length > 0 && !isCompact && (
          <div className="pt-1 border-t border-white/10">
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between text-[11px] text-white/60 hover:text-white py-1"
            >
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3 text-purple-400" />
                <span>Session Dialogue ({history.length} turns)</span>
              </span>
              <span className="text-[10px] text-purple-300 font-mono">
                {showHistory ? "Hide" : "Show"}
              </span>
            </button>

            {showHistory && (
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto custom-scrollbar p-2 rounded-xl bg-black/40 border border-white/10 text-xs">
                {history.map((turn) => (
                  <div
                    key={turn.id}
                    className={`p-2 rounded-lg ${
                      turn.role === "user"
                        ? "bg-cyan-950/30 border border-cyan-500/20 text-cyan-200"
                        : "bg-purple-950/30 border border-purple-500/20 text-white/90"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-white/40 mb-0.5">
                      <span className="font-bold uppercase tracking-wider">
                        {turn.role === "user" ? "You" : "Gemini"}
                      </span>
                      <span>{turn.timestamp}</span>
                    </div>
                    <p className="leading-snug">{turn.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
