import { useState, useEffect, useRef, useCallback } from "react";
import {
  Sparkles,
  Mic,
  MicOff,
  Copy,
  Check,
  ExternalLink,
  Move,
  X,
  Bot,
  Brain,
  MessageSquare,
  HelpCircle,
  Zap,
  BookOpen,
  Trash2,
  Share2,
  Maximize2,
  Minimize2,
  AppWindow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface StudyGeminiLiveProps {
  open: boolean;
  onClose: () => void;
  userId?: string | number;
  subject?: string;
  activeTaskTitle?: string;
  secondsLeft?: number;
  timerMode?: "focus" | "shortBreak" | "longBreak";
  pos?: { x: number; y: number };
  onPosChange?: (pos: { x: number; y: number }) => void;
  zIndex?: number;
  onFocus?: () => void;
}

export function StudyGeminiLive({
  open,
  onClose,
  subject = "General Study",
  pos = { x: 380, y: 70 },
  onPosChange,
  zIndex = 40,
  onFocus,
}: StudyGeminiLiveProps) {
  // Speech-to-Text State
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [dictatedText, setDictatedText] = useState("");
  const [copied, setCopied] = useState(false);

  // Movable & Resizable Window State
  const [windowPos, setWindowPos] = useState(pos);
  const [windowSize, setWindowSize] = useState<{ width: number; height: number }>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("study_gemini_window_size");
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
    return { width: 440, height: 500 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 });

  const [isCornerResizing, setIsCornerResizing] = useState(false);
  const cornerResizeStartRef = useRef({ mouseX: 0, mouseY: 0, startW: 0, startH: 0 });

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setWindowPos(pos);
  }, [pos.x, pos.y]);

  // Check speech recognition support
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSpeechSupported(false);
      }
    }
  }, []);

  // Launch Google Gemini Window or Tab
  const launchGemini = useCallback((promptText?: string) => {
    const textToUse = (promptText || dictatedText).trim();
    if (textToUse) {
      try {
        navigator.clipboard.writeText(textToUse);
        toast.success("Copied to clipboard! Paste directly in Gemini.");
      } catch {}
    }

    // Open Gemini in a dedicated companion window
    const width = 900;
    const height = 850;
    const left = Math.max(50, window.screen.width - width - 50);
    const top = 50;

    window.open(
      "https://gemini.google.com",
      "GoogleGeminiStudyCompanion",
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`
    );
  }, [dictatedText]);

  // Open Gemini in Full Tab
  const openGeminiTab = useCallback((promptText?: string) => {
    const textToUse = (promptText || dictatedText).trim();
    if (textToUse) {
      try {
        navigator.clipboard.writeText(textToUse);
        toast.success("Copied to clipboard! Paste directly in Gemini.");
      } catch {}
    }
    window.open("https://gemini.google.com", "_blank", "noopener,noreferrer");
  }, [dictatedText]);

  // Toggle Continuous Speech-to-Text Dictation
  const toggleListening = () => {
    if (!speechSupported) {
      toast.error("Speech Recognition is not supported on this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
    } else {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setIsListening(true);
          toast.info("Listening... Speak your study question or thoughts.");
        };

        recognition.onresult = (event: any) => {
          let interim = "";
          let finalTranscript = "";

          for (let i = 0; i < event.results.length; ++i) {
            const part = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += part + " ";
            } else {
              interim += part;
            }
          }

          const combined = (finalTranscript + interim).trim();
          if (combined) {
            setDictatedText(combined);
          }
        };

        recognition.onerror = (event: any) => {
          if (event.error !== "no-speech" && event.error !== "aborted") {
            console.warn("Speech error:", event.error);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.warn("Failed to start speech recognition:", err);
        setIsListening(false);
      }
    }
  };

  // Cleanup speech recognition on unmount or close
  useEffect(() => {
    if (!open && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    }
  }, [open]);

  // Copy Dictated Text
  const handleCopy = () => {
    if (!dictatedText.trim()) return;
    try {
      navigator.clipboard.writeText(dictatedText.trim());
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  // Quick Study Prompt Chips
  const studyPrompts = [
    { label: "💡 Explain Concept", prompt: `Explain the core concept and principles of ${subject} step-by-step with practical examples.` },
    { label: "📝 5-Question Quiz", prompt: `Generate a 5-question active recall practice quiz with detailed explanations for ${subject}.` },
    { label: "📐 Formulas & Rules", prompt: `Summarize the foundational formulas, mathematical equations, and theorems for ${subject}.` },
    { label: "🧠 Memory Mnemonic", prompt: `Provide high-retention memory mnemonics and visualization techniques for key ${subject} topics.` },
    { label: "📋 Flashcard Summary", prompt: `Create concise high-yield revision flashcards for my upcoming exam in ${subject}.` },
  ];

  // Dragging Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, input, textarea, a")) return;
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
      const maxX = Math.max(10, window.innerWidth - windowSize.width - 10);
      const maxY = Math.max(40, window.innerHeight - 100);
      const newX = Math.max(10, Math.min(maxX, dragStartRef.current.posX + dx));
      const newY = Math.max(40, Math.min(maxY, dragStartRef.current.posY + dy));
      const nextPos = { x: newX, y: newY };
      setWindowPos(nextPos);
      onPosChange?.(nextPos);
    };

    const handleMouseUp = () => {
      if (isDragging) setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, onPosChange, windowSize.width]);

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
        localStorage.setItem("study_gemini_window_size", JSON.stringify(finalSize));
      } catch {}
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isCornerResizing, windowPos.x, windowPos.y, windowSize]);

  if (!open) return null;

  return (
    <div
      onMouseDownCapture={onFocus}
      style={{
        left: `${windowPos.x}px`,
        top: `${windowPos.y}px`,
        width: `${windowSize.width}px`,
        height: `${windowSize.height}px`,
        zIndex,
      }}
      className="fixed max-w-[98vw] max-h-[92vh] select-none rounded-2xl border border-purple-500/30 bg-zinc-950/90 backdrop-blur-2xl shadow-2xl shadow-purple-950/40 text-white overflow-hidden transition-shadow flex flex-col font-sans"
    >
      {/* 1. Window Title Bar */}
      <div
        onMouseDown={handleMouseDown}
        className="flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-purple-950/60 via-zinc-900/80 to-indigo-950/60 border-b border-white/10 cursor-move"
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
            onClick={() => launchGemini()}
            className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 border border-yellow-600/60 flex items-center justify-center transition-transform active:scale-90"
            title="Launch Gemini Companion Window"
          >
            <AppWindow className="w-2 h-2 text-black/80 opacity-0 hover:opacity-100 transition-opacity" />
          </button>
          <button
            type="button"
            onClick={() => openGeminiTab()}
            className="w-3 h-3 rounded-full bg-emerald-500/80 hover:bg-emerald-500 border border-emerald-600/60 flex items-center justify-center transition-transform active:scale-90"
            title="Open Gemini in New Tab"
          >
            <ExternalLink className="w-2 h-2 text-black/80 opacity-0 hover:opacity-100 transition-opacity" />
          </button>
        </div>

        {/* Title */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-white/90">
          <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
          <span>Google Gemini AI</span>
          <Badge variant="outline" className="text-[9px] py-0 px-1 border-purple-500/40 text-purple-300">
            Live
          </Badge>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="h-6 w-6 text-white/60 hover:text-white hover:bg-white/10 rounded-md"
            title="Close"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* 2. Main Window Body */}
      <div className="p-4 space-y-3.5 text-xs">
        {/* Direct 1-Click Launch Header */}
        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-900/40 via-indigo-900/30 to-purple-950/50 border border-purple-500/30 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-md">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-xs">Google Gemini Direct</h4>
                <p className="text-[10px] text-purple-200/70">Official Google Gemini AI Workspace</p>
              </div>
            </div>
            <Badge className="bg-purple-600/30 text-purple-300 border-purple-500/40 text-[10px]">
              {subject}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              size="sm"
              onClick={() => launchGemini()}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-medium shadow-md flex items-center justify-center gap-1.5 h-8"
            >
              <AppWindow className="h-3.5 w-3.5" />
              <span>Launch App Window</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openGeminiTab()}
              className="border-white/20 hover:bg-white/10 text-white/90 text-xs font-medium flex items-center justify-center gap-1.5 h-8"
            >
              <ExternalLink className="h-3.5 w-3.5 text-cyan-300" />
              <span>Open in Tab</span>
            </Button>
          </div>
        </div>

        {/* 3. Live Speech-to-Text Dictation Pad */}
        <div className="space-y-2 p-3 rounded-xl bg-zinc-900/70 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Mic className={`h-3.5 w-3.5 ${isListening ? "text-red-400 animate-pulse" : "text-purple-400"}`} />
              <span className="font-semibold text-white/90 text-xs">Speech-to-Text Dictation</span>
            </div>
            {isListening && (
              <span className="flex items-center gap-1 text-[10px] text-red-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                Listening Live...
              </span>
            )}
          </div>

          <div className="relative">
            <Textarea
              placeholder="Click 'Start Dictating' or type here, then send to Gemini..."
              rows={3}
              value={dictatedText}
              onChange={(e) => setDictatedText(e.target.value)}
              className="bg-zinc-950/80 border-white/15 text-xs text-white resize-none pr-8 focus-visible:ring-purple-500/50"
            />
            {dictatedText && (
              <button
                type="button"
                onClick={() => setDictatedText("")}
                className="absolute top-2 right-2 p-1 text-white/40 hover:text-white"
                title="Clear text"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <Button
              size="sm"
              variant={isListening ? "destructive" : "secondary"}
              onClick={toggleListening}
              className={`h-7 px-2.5 text-[11px] gap-1.5 font-medium transition-all ${
                isListening
                  ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30"
                  : "bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40"
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="h-3 w-3" />
                  <span>Stop Dictating</span>
                </>
              ) : (
                <>
                  <Mic className="h-3 w-3" />
                  <span>Start Dictating</span>
                </>
              )}
            </Button>

            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                disabled={!dictatedText.trim()}
                className="h-7 px-2 text-[11px] text-white/70 hover:text-white hover:bg-white/10 gap-1"
                title="Copy text"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </Button>

              <Button
                size="sm"
                onClick={() => launchGemini(dictatedText)}
                disabled={!dictatedText.trim()}
                className="h-7 px-2.5 text-[11px] bg-purple-600 hover:bg-purple-500 text-white font-semibold gap-1 shadow-sm"
              >
                <Sparkles className="h-3 w-3" />
                <span>Send to Gemini</span>
              </Button>
            </div>
          </div>
        </div>

        {/* 4. Instant Study Prompts for Gemini */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">
            Quick Study Starters ({subject})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {studyPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setDictatedText(p.prompt);
                  launchGemini(p.prompt);
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-purple-600/20 border border-white/10 hover:border-purple-500/40 text-white/80 hover:text-white transition-all text-left flex items-center gap-1"
              >
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom-Right macOS Corner Resize Handle */}
      <div
        onMouseDown={handleCornerResizeMouseDown}
        className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize flex items-center justify-center text-purple-400/30 hover:text-purple-300 transition-colors z-50 group"
        title="Drag to resize Gemini window"
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
    </div>
  );
}
