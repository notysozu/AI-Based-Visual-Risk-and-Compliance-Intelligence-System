import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Sparkles,
  User,
  CheckCircle2,
  XCircle,
  TrendingUp,
  BrainCircuit,
  Clock,
  DollarSign,
  Sliders,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  Mic,
  MicOff,
  Brain,
  AudioWaveform,
  Send,
  ChevronDown,
  ChevronRight,
  Laptop,
  CalendarCheck
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import {
  getChatSessions,
  getChatMessages,
  sendChatMessage,
  createThreadAndSendMessage,
  executeChatAction,
  rejectChatAction,
  type ChatSessionData,
  type ChatMessageData
} from "@/lib/api";
import { useTwin, today } from "@/lib/twin-store";

// Clean, high-impact demonstration cards
const DEMO_CARDS = [
  {
    title: "Major Purchase Tradeoff",
    desc: "Calculate milestone delay & 5-year opportunity cost",
    prompt: "If I buy a $1,200 laptop today, how does that affect my emergency fund goal?",
    icon: Laptop,
    badge: "Milestone",
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20"
  },
  {
    title: "Optimize Daily Routine",
    desc: "Suggest and schedule optimal focus & vitality blocks",
    prompt: "Plan my day with high-impact deep work and recovery blocks",
    icon: CalendarCheck,
    badge: "Multi-Task",
    color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20"
  },
  {
    title: "Sleep & Study Shift",
    desc: "Simulate habit tradeoffs against vitality & focus indices",
    prompt: "What if I study 5 more hours a week and sleep 30 mins less?",
    icon: BrainCircuit,
    badge: "What-If",
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20"
  },
  {
    title: "Monte Carlo Wealth Plan",
    desc: "Execute 500 stochastic trials for retirement odds",
    prompt: "Run Monte Carlo wealth simulation for my retirement",
    icon: TrendingUp,
    badge: "Forecasting",
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20"
  }
];

export function TwinChat({
  fullHeight = false,
  className = "",
  selectedSessionId
}: {
  fullHeight?: boolean;
  className?: string;
  selectedSessionId?: number;
} = {}) {
  const navigate = useNavigate();
  const { state, addTask, addTxn, updateProfile, saveScenarioPresets } = useTwin();
  const userId = state.profile.id ?? 1;

  const [sessions, setSessions] = useState<ChatSessionData[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(selectedSessionId ?? null);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [isThinkMode, setIsThinkMode] = useState(true);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevMsgCountRef = useRef<number>(0);
  const isActionUpdatingRef = useRef<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Load sessions on mount or user change
  useEffect(() => {
    loadSessions();
  }, [userId]);

  // Listen to global events for New Chat Draft and Thread Switching without URL params
  useEffect(() => {
    const handleNewDraft = () => {
      setActiveSessionId(null);
      setMessages([]);
      setInputPrompt("");
    };

    const handleSwitch = (e: any) => {
      const sId = e.detail?.sessionId;
      if (sId) {
        setActiveSessionId(sId);
        loadMessages(sId);
      }
    };

    const handleUpdated = () => {
      loadSessions(false);
    };

    window.addEventListener("twin-new-chat-draft", handleNewDraft);
    window.addEventListener("twin-switch-chat-session", handleSwitch);
    window.addEventListener("chat-sessions-updated", handleUpdated);

    return () => {
      window.removeEventListener("twin-new-chat-draft", handleNewDraft);
      window.removeEventListener("twin-switch-chat-session", handleSwitch);
      window.removeEventListener("chat-sessions-updated", handleUpdated);
    };
  }, [userId]);

  // Sync with selectedSessionId prop if passed
  useEffect(() => {
    if (selectedSessionId && selectedSessionId !== activeSessionId) {
      setActiveSessionId(selectedSessionId);
    }
  }, [selectedSessionId]);

  // Load messages when active session changes
  useEffect(() => {
    if (activeSessionId) {
      loadMessages(activeSessionId);
    } else {
      setMessages([]);
    }
  }, [activeSessionId]);

  // Scroll only when new messages are added or user submits, NOT on action approval
  useEffect(() => {
    if (isActionUpdatingRef.current) {
      isActionUpdatingRef.current = false;
      return;
    }

    if (messages.length > prevMsgCountRef.current || loading) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMsgCountRef.current = messages.length;
  }, [messages, loading]);

  const loadSessions = async (setDefault = true) => {
    try {
      if (setDefault) setInitialLoading(true);
      const data = await getChatSessions(userId);
      if (data && data.length > 0) {
        setSessions(data);
        if (setDefault) {
          if (selectedSessionId && data.some((s) => s.id === selectedSessionId)) {
            setActiveSessionId(selectedSessionId);
          } else if (!activeSessionId || !data.some((s) => s.id === activeSessionId)) {
            setActiveSessionId(data[0].id);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load chat sessions:", err);
    } finally {
      if (setDefault) setInitialLoading(false);
    }
  };

  const loadMessages = async (sessionId: number) => {
    try {
      const data = await getChatMessages(sessionId, Number(userId));
      setMessages(data);
      prevMsgCountRef.current = data.length;
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  const handleCopyMessage = (id: number, text: string) => {
    const cleanText = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    navigator.clipboard.writeText(cleanText);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Speech-to-Text (STT) Handler
  const toggleSpeechRecognition = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        toast.info("Listening... Speak your question");
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.resultIndex !== undefined ? event.results[i][0].transcript : "";
        }
        if (transcript) {
          setInputPrompt(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error !== "no-speech") {
          toast.error(`Voice error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsListening(false);
      toast.error("Could not access microphone");
    }
  };

  const handleSend = async (customPrompt?: string) => {
    const promptToSend = (customPrompt || inputPrompt).trim();
    if (!promptToSend || loading) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    setInputPrompt("");
    const optimisticUserMsg: ChatMessageData = {
      id: Date.now(),
      session_id: activeSessionId || 0,
      role: "user",
      content: promptToSend,
      action_type: "none",
      action_status: "none",
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, optimisticUserMsg]);
    setLoading(true);

    try {
      const clientContext = {
        goalName: state.profile.goalName,
        goalTarget: state.profile.goalTarget,
        goalCurrent: state.profile.goalCurrent,
        role: state.profile.role,
        monthlyIncome: state.profile.monthlyIncome,
        monthlyExpenses: state.profile.monthlyExpenses,
        netWorth: state.profile.netWorth
      };

      // Case A: Draft mode (no active session yet)
      if (!activeSessionId) {
        const res = await createThreadAndSendMessage({
          user_id: Number(userId),
          prompt: promptToSend,
          think_mode: isThinkMode,
          client_context: clientContext
        });

        setActiveSessionId(res.session.id);
        setMessages([res.user_message, res.assistant_message]);
        setSessions((prev) => [res.session, ...prev.filter((s) => s.id !== res.session.id)]);
        window.dispatchEvent(new Event("chat-sessions-updated"));
      } else {
        // Case B: Existing session
        const res = await sendChatMessage(activeSessionId, {
          user_id: Number(userId),
          prompt: promptToSend,
          think_mode: isThinkMode,
          client_context: clientContext
        });

        setMessages((prev) => [
          ...prev.filter((m) => m.id !== optimisticUserMsg.id),
          res.user_message,
          res.assistant_message
        ]);

        const updatedSessions = await getChatSessions(userId);
        setSessions(updatedSessions);
        window.dispatchEvent(new Event("chat-sessions-updated"));
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to communicate with Digital Twin AI");
    } finally {
      setLoading(false);
    }
  };

  const handleActionApproval = async (msg: ChatMessageData) => {
    if (!msg.action_payload || !msg.action_type) return;
    isActionUpdatingRef.current = true;

    try {
      const payload = JSON.parse(msg.action_payload);
      
      await executeChatAction(msg.id, {
        user_id: Number(userId),
        action_type: msg.action_type,
        action_payload: payload
      });

      if (msg.action_type === "add_multiple_tasks") {
        const tasks = payload.tasks || [];
        for (const t of tasks) {
          addTask({
            title: t.title || "Focus Block",
            start: t.start || "09:00",
            minutes: Number(t.minutes || 45),
            category: t.category || "Work",
            done: false,
            date: today()
          });
        }
        toast.success(`✓ Added ${tasks.length} tasks directly to your Daily Planner`);
      } else if (msg.action_type === "add_task") {
        addTask({
          title: payload.title || "Focus Sprint",
          start: payload.start || "09:00",
          minutes: Number(payload.minutes || 45),
          category: payload.category || "Work",
          done: false,
          date: today()
        });
        toast.success(`✓ Added "${payload.title}" to your Daily Planner`);
      } else if (msg.action_type === "update_settings") {
        await updateProfile(payload);
        toast.success("✓ Profile settings updated successfully");
      } else if (msg.action_type === "simulate_what_if") {
        await saveScenarioPresets(
          { savings: 0, sleep: 0, study: 0 },
          {
            savings: Number(payload.savings_delta || 0),
            sleep: Number(payload.sleep_delta || 0),
            study: Number(payload.study_delta || 0)
          }
        );
        toast.success("✓ What-If scenario preset applied to Scenario B");
      } else if (msg.action_type === "purchase_impact") {
        const cost = Number(payload.cost || 0);
        if (cost > 0) {
          addTxn({
            date: today(),
            label: `Purchase: ${payload.item_name || "Major Purchase"}`,
            amount: cost,
            kind: "expense"
          });
          toast.success(`✓ Recorded $${cost.toLocaleString()} expense transaction`);
        }
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, action_status: "executed" } : m))
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to execute action");
    }
  };

  const handleActionRejection = async (msg: ChatMessageData) => {
    isActionUpdatingRef.current = true;
    try {
      await rejectChatAction(msg.id, { user_id: Number(userId) });
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, action_status: "rejected" } : m))
      );
      toast.info("Action proposal dismissed");
    } catch (err) {
      console.error(err);
    }
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const isConversationEmpty = messages.length === 0;

  return (
    <div
      className={`flex flex-col ${
        fullHeight
          ? "h-[calc(100vh-4rem)] w-full bg-transparent"
          : "h-[660px] rounded-3xl border border-border/80 bg-card text-foreground dark:bg-[#171717] dark:text-white shadow-xl backdrop-blur-2xl overflow-hidden"
      } transition-all ${className}`}
    >
      {/* Top Header Bar (Only shown when embedded as a widget) */}
      {!fullHeight && (
        <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between bg-card/40 dark:bg-black/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-[#0071E3] to-indigo-600 text-white shadow-xs">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div>
              <span className="font-semibold text-xs tracking-tight text-foreground dark:text-white">
                Digital Twin Copilot
              </span>
              <span className="mx-1.5 text-muted-foreground dark:text-white/30 text-xs">•</span>
              <span className="text-[11px] text-muted-foreground dark:text-white/60 truncate max-w-[180px] sm:max-w-xs">
                {activeSession ? activeSession.title : "Active Conversation"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isThinkMode && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#0071E3]/15 text-[#0071E3] dark:text-blue-400 border border-[#0071E3]/30 flex items-center gap-1">
                <Brain className="h-3 w-3" /> Think Active
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              Live
            </span>
          </div>
        </div>
      )}

      {/* Messages & Empty State Scroll Feed */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {initialLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 text-muted-foreground dark:text-white/50">
            <RefreshCw className="h-6 w-6 animate-spin text-[#0071E3]" />
            <p className="text-xs">Initializing Digital Twin Intelligence...</p>
          </div>
        ) : isConversationEmpty ? (
          /* ChatGPT Style Centered Hero with Easy Demonstrations */
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 px-4 max-w-3xl mx-auto">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground dark:text-white">
                What’s on the agenda today?
              </h2>
              <p className="text-xs text-muted-foreground dark:text-white/50 max-w-md mx-auto">
                Click an easy demonstration below or ask your own customized life and financial questions.
              </p>
            </div>

            {/* Clean Demonstration Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
              {DEMO_CARDS.map((demo, idx) => {
                const Icon = demo.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(demo.prompt)}
                    disabled={loading}
                    className="p-3.5 rounded-2xl bg-card dark:bg-white/5 hover:bg-muted dark:hover:bg-white/10 border border-border/70 dark:border-white/10 text-left transition-all hover:border-[#0071E3]/50 dark:hover:border-white/20 shadow-2xs group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg border ${demo.color}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-semibold text-foreground dark:text-white">
                          {demo.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground dark:text-white/40 uppercase">
                        {demo.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground dark:text-white/60 leading-snug">
                      {demo.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((m) => (
              <ChatMessageItem
                key={m.id}
                message={m}
                copiedId={copiedId}
                onCopy={handleCopyMessage}
                onApprove={() => handleActionApproval(m)}
                onReject={() => handleActionRejection(m)}
                onNavigate={(path) => navigate({ to: path })}
              />
            ))}
          </div>
        )}

        {/* Dynamic "Thinking..." Loading Indicator */}
        {loading && (
          <div className="max-w-3xl mx-auto flex gap-3.5 justify-start items-center text-xs text-muted-foreground dark:text-white/60 animate-pulse">
            <div className="h-7 w-7 rounded-full bg-muted dark:bg-white/10 text-[#0071E3] flex items-center justify-center shadow-xs">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            </div>
            <span className="font-medium tracking-wide">Thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* CHATGPT STYLE FLOATING BOTTOM PILL BAR (Edge-to-Edge Canvas)  */}
      {/* ------------------------------------------------------------- */}
      <div className="p-4 sm:p-5 pt-0 shrink-0">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className={`relative rounded-full bg-card dark:bg-[#212121] border px-4 py-2 flex items-center gap-2 shadow-lg dark:shadow-2xl transition-all ${
              isListening
                ? "border-rose-500 ring-2 ring-rose-500/20"
                : "border-border/80 dark:border-white/15 hover:border-border dark:hover:border-white/25 focus-within:border-[#0071E3]/60 dark:focus-within:border-white/40 focus-within:ring-1 focus-within:ring-[#0071E3]/20"
            }`}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={isListening ? "Listening... speak now" : "Ask anything"}
              disabled={loading}
              className="flex-1 bg-transparent text-sm text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/40 focus:outline-none px-1"
            />

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsThinkMode(!isThinkMode);
                  toast.info(
                    !isThinkMode
                      ? "💡 Reasoning Think Mode enabled (Chain-of-thought active)"
                      : "Direct Mode enabled (Fast response)"
                  );
                }}
                className={`h-7 px-2.5 rounded-full text-[11px] font-medium flex items-center gap-1 transition-colors ${
                  isThinkMode
                    ? "bg-[#0071E3]/15 text-[#0071E3] dark:text-blue-400 border border-[#0071E3]/30"
                    : "text-muted-foreground dark:text-white/50 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-white/5"
                }`}
                title="Toggle Step-by-Step Reasoning (Think Mode)"
              >
                <Brain className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Think</span>
              </button>

              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`h-7 w-7 rounded-full flex items-center justify-center transition-colors ${
                  isListening
                    ? "bg-rose-500 text-white animate-pulse shadow-xs"
                    : "text-muted-foreground dark:text-white/50 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-white/5"
                }`}
                title={isListening ? "Stop Voice Input" : "Speak to Twin (Voice Input)"}
              >
                {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-4 w-4" />}
              </button>

              <button
                type="submit"
                disabled={!inputPrompt.trim() || loading}
                className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${
                  inputPrompt.trim() && !loading
                    ? "bg-[#0071E3] hover:bg-[#0071E3]/90 text-white shadow-md cursor-pointer active:scale-95"
                    : "bg-muted dark:bg-white/10 text-muted-foreground/40 dark:text-white/30 cursor-not-allowed"
                }`}
                title="Send message"
              >
                {inputPrompt.trim() ? (
                  <Send className="h-3.5 w-3.5" />
                ) : (
                  <AudioWaveform className="h-4 w-4" />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Message Item with Collapsible Thinking Box & Formatted Markdown
// -----------------------------------------------------------------------------

function ChatMessageItem({
  message,
  copiedId,
  onCopy,
  onApprove,
  onReject,
  onNavigate
}: {
  message: ChatMessageData;
  copiedId: number | null;
  onCopy: (id: number, content: string) => void;
  onApprove: () => void;
  onReject: () => void;
  onNavigate: (path: string) => void;
}) {
  const [isThoughtExpanded, setIsThoughtExpanded] = useState(false);

  let thoughtContent: string | null = null;
  let mainContent = message.content;

  const thinkMatch = message.content.match(/<think>([\s\S]*?)<\/think>/);
  if (thinkMatch) {
    thoughtContent = thinkMatch[1].trim();
    mainContent = message.content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  }

  // Sanitize and replace <br> tags with standard markdown line breaks
  const sanitizedMarkdown = mainContent
    .replace(/<br\s*\/?>/gi, "\n\n")
    .replace(/([^\n])\n(\|[\s\S]+?\|)\n/g, "$1\n\n$2\n");

  return (
    <div
      className={`flex gap-3.5 text-xs sm:text-sm group ${
        message.role === "user" ? "justify-end" : "justify-start"
      }`}
    >
      {message.role !== "user" && (
        <div className="flex-shrink-0 h-7 w-7 rounded-full bg-muted dark:bg-white/10 border border-border/60 dark:border-white/10 text-[#0071E3] flex items-center justify-center mt-0.5 shadow-2xs">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
      )}

      <div
        className={`max-w-[90%] sm:max-w-[85%] relative ${
          message.role === "user"
            ? "bg-secondary text-secondary-foreground dark:bg-[#2f2f2f] dark:text-white px-4 py-2.5 rounded-3xl rounded-tr-xs shadow-2xs text-xs sm:text-sm border border-border/50 dark:border-transparent font-normal"
            : "bg-transparent text-foreground dark:text-white/90 pr-2 flex-1"
        }`}
      >
        {message.role !== "user" ? (
          <div className="space-y-2.5">
            {thoughtContent && (
              <div className="rounded-xl border border-border/60 dark:border-white/10 bg-muted/40 dark:bg-white/5 overflow-hidden transition-all text-xs">
                <button
                  type="button"
                  onClick={() => setIsThoughtExpanded(!isThoughtExpanded)}
                  className="w-full px-3 py-2 flex items-center justify-between text-muted-foreground dark:text-white/60 hover:text-foreground dark:hover:text-white transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 font-medium text-[11px]">
                    <Brain className="h-3.5 w-3.5 text-[#0071E3]" />
                    <span>Thought Process</span>
                  </div>
                  {isThoughtExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                  )}
                </button>

                {isThoughtExpanded && (
                  <div className="px-3 pb-2.5 pt-1 text-[11px] font-mono text-muted-foreground dark:text-white/70 whitespace-pre-line border-t border-border/40 dark:border-white/5 leading-relaxed bg-background/50 dark:bg-black/20">
                    {thoughtContent}
                  </div>
                )}
              </div>
            )}

            <div className="prose-chat leading-relaxed space-y-2">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ node, ...props }) => (
                    <h1 className="text-base font-semibold text-foreground dark:text-white mt-3 mb-1.5" {...props} />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2 className="text-sm font-semibold text-foreground dark:text-white mt-3 mb-1.5" {...props} />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3 className="text-sm font-semibold text-foreground dark:text-white mt-2.5 mb-1 tracking-tight" {...props} />
                  ),
                  h4: ({ node, ...props }) => (
                    <h4 className="text-xs font-semibold text-muted-foreground dark:text-white/70 mt-2 mb-1 uppercase tracking-wider font-mono" {...props} />
                  ),
                  p: ({ node, ...props }) => (
                    <p className="leading-relaxed my-1 text-xs sm:text-sm text-foreground dark:text-white/90" {...props} />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul className="list-disc list-outside ml-4 my-2 space-y-1 text-xs sm:text-sm text-foreground dark:text-white/90" {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol className="list-decimal list-outside ml-4 my-2 space-y-1 text-xs sm:text-sm text-foreground dark:text-white/90" {...props} />
                  ),
                  li: ({ node, ...props }) => <li className="leading-relaxed pl-1" {...props} />,
                  strong: ({ node, ...props }) => (
                    <strong className="font-semibold text-foreground dark:text-white" {...props} />
                  ),
                  blockquote: ({ node, ...props }) => (
                    <blockquote
                      className="border-l-2 border-[#0071E3] bg-[#0071E3]/5 dark:bg-white/5 pl-3 py-1.5 my-2.5 rounded-r text-xs sm:text-sm text-foreground/90 dark:text-white/80 font-normal italic"
                      {...props}
                    />
                  ),
                  // Styled Markdown Tables
                  table: ({ node, ...props }) => (
                    <div className="my-3 w-full overflow-x-auto rounded-xl border border-border/70 dark:border-white/10 shadow-xs bg-card/60 dark:bg-white/2">
                      <table className="w-full text-left border-collapse text-xs sm:text-sm" {...props} />
                    </div>
                  ),
                  thead: ({ node, ...props }) => (
                    <thead className="bg-muted/80 dark:bg-white/10 text-foreground dark:text-white border-b border-border/70 dark:border-white/10 font-semibold" {...props} />
                  ),
                  tbody: ({ node, ...props }) => (
                    <tbody className="divide-y divide-border/40 dark:divide-white/5" {...props} />
                  ),
                  tr: ({ node, ...props }) => (
                    <tr className="hover:bg-muted/40 dark:hover:bg-white/5 transition-colors" {...props} />
                  ),
                  th: ({ node, ...props }) => (
                    <th className="px-3.5 py-2.5 font-semibold text-xs text-foreground dark:text-white border-r border-border/30 dark:border-white/5 last:border-r-0" {...props} />
                  ),
                  td: ({ node, ...props }) => (
                    <td className="px-3.5 py-2.5 text-xs text-foreground/90 dark:text-white/80 border-r border-border/20 dark:border-white/5 last:border-r-0" {...props} />
                  ),
                  code: ({ node, inline, ...props }: any) =>
                    inline ? (
                      <code className="font-mono bg-muted dark:bg-white/10 px-1.5 py-0.5 rounded text-[11px] text-[#0071E3] dark:text-blue-400" {...props} />
                    ) : (
                      <pre className="font-mono bg-muted/60 dark:bg-black/40 p-3 rounded-xl text-xs overflow-x-auto my-2 border border-border/60 dark:border-white/10 text-foreground dark:text-white/90">
                        <code {...props} />
                      </pre>
                    )
                }}
              >
                {sanitizedMarkdown}
              </ReactMarkdown>

              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground dark:text-white/40">
                <button
                  type="button"
                  onClick={() => onCopy(message.id, message.content)}
                  className="p-1 rounded hover:bg-muted dark:hover:bg-white/10 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Copy response"
                >
                  {copiedId === message.id ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-500" />
                      <span className="text-emerald-500">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="leading-relaxed whitespace-pre-wrap">{message.content}</div>
        )}

        {message.action_payload && message.action_type && message.action_type !== "none" && (
          <InteractiveActionCard
            message={message}
            onApprove={onApprove}
            onReject={onReject}
            onNavigate={onNavigate}
          />
        )}
      </div>

      {message.role === "user" && (
        <div className="flex-shrink-0 h-7 w-7 rounded-full bg-muted dark:bg-white/10 text-foreground dark:text-white/80 flex items-center justify-center mt-0.5">
          <User className="h-3.5 w-3.5" />
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Interactive Action Card Component with Multi-Task Support
// -----------------------------------------------------------------------------

function InteractiveActionCard({
  message,
  onApprove,
  onReject,
  onNavigate
}: {
  message: ChatMessageData;
  onApprove: () => void;
  onReject: () => void;
  onNavigate: (path: string) => void;
}) {
  const { action_type, action_status, action_payload } = message;
  if (!action_payload) return null;

  let data: any = {};
  try {
    data = JSON.parse(action_payload);
  } catch (e) {
    return null;
  }

  const isExecuted = action_status === "executed" || action_status === "approved";
  const isRejected = action_status === "rejected";

  // MULTI-TASK SCHEDULE PROPOSAL
  if (action_type === "add_multiple_tasks") {
    const tasks = data.tasks || [];
    return (
      <div className="mt-3.5 p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-500/10 space-y-3 text-xs shadow-md">
        <div className="flex items-center justify-between border-b border-indigo-500/15 pb-2.5">
          <span className="font-semibold text-foreground dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
            <Clock className="h-4 w-4 text-[#0071E3]" />
            Calibrated Daily Schedule ({tasks.length} Blocks)
          </span>
          {isExecuted ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> All {tasks.length} Tasks Added to Planner
            </span>
          ) : isRejected ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-muted dark:bg-white/10 text-muted-foreground dark:text-white/40 flex items-center gap-1">
              <XCircle className="h-3 w-3" /> Dismissed
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              Needs Approval
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {tasks.map((t: any, idx: number) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-background/80 dark:bg-black/40 border border-border/50 dark:border-white/5 space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] bg-muted/70 dark:bg-white/10 px-1.5 py-0.5 rounded font-semibold text-[#0071E3]">
                  {t.start} ({t.minutes}m)
                </span>
                <span className="text-[10px] text-muted-foreground dark:text-white/50 font-mono uppercase">{t.category}</span>
              </div>
              <p className="font-semibold text-foreground dark:text-white text-xs truncate">{t.title}</p>
              <p className="text-[10.5px] text-emerald-500 dark:text-emerald-400">{t.impact}</p>
            </div>
          ))}
        </div>

        {!isExecuted && !isRejected && (
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onApprove}
              className="h-8 px-3.5 rounded-xl text-xs bg-[#0071E3] hover:bg-[#0071E3]/90 text-white font-medium flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Approve & Add All {tasks.length} Tasks
            </button>
            <button
              type="button"
              onClick={onReject}
              className="h-8 px-3 rounded-xl text-xs text-muted-foreground hover:text-foreground dark:text-white/60 dark:hover:text-white hover:bg-muted dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    );
  }

  // SINGLE TASK ADDITION
  if (action_type === "add_task") {
    return (
      <div className="mt-3.5 p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-500/10 space-y-3 text-xs shadow-md">
        <div className="flex items-center justify-between border-b border-indigo-500/15 pb-2.5">
          <span className="font-semibold text-foreground dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
            <Clock className="h-4 w-4 text-[#0071E3]" />
            Schedule Addition: {data.title}
          </span>
          {isExecuted ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Added to Planner
            </span>
          ) : isRejected ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-muted dark:bg-white/10 text-muted-foreground dark:text-white/40 flex items-center gap-1">
              <XCircle className="h-3 w-3" /> Dismissed
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              Needs Approval
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="p-2.5 rounded-xl bg-background/80 dark:bg-black/40 border border-border/50 dark:border-white/5">
            <span className="text-[10px] text-muted-foreground dark:text-white/50 block">Scheduled Time</span>
            <span className="font-semibold text-foreground dark:text-white font-mono">{data.start}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-background/80 dark:bg-black/40 border border-border/50 dark:border-white/5">
            <span className="text-[10px] text-muted-foreground dark:text-white/50 block">Duration</span>
            <span className="font-semibold text-foreground dark:text-white font-mono">{data.minutes} mins</span>
          </div>
          <div className="p-2.5 rounded-xl bg-background/80 dark:bg-black/40 border border-border/50 dark:border-white/5">
            <span className="text-[10px] text-muted-foreground dark:text-white/50 block">Category</span>
            <span className="font-semibold text-[#0071E3]">{data.category}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-background/80 dark:bg-black/40 border border-border/50 dark:border-white/5">
            <span className="text-[10px] text-muted-foreground dark:text-white/50 block">Impact</span>
            <span className="font-semibold text-emerald-500 dark:text-emerald-400">{data.impact}</span>
          </div>
        </div>

        {!isExecuted && !isRejected && (
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onApprove}
              className="h-8 px-3.5 rounded-xl text-xs bg-[#0071E3] hover:bg-[#0071E3]/90 text-white font-medium flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Approve & Add Task
            </button>
            <button
              type="button"
              onClick={onReject}
              className="h-8 px-3 rounded-xl text-xs text-muted-foreground hover:text-foreground dark:text-white/60 dark:hover:text-white hover:bg-muted dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    );
  }

  // PURCHASE TRADEOFF IMPACT
  if (action_type === "purchase_impact") {
    return (
      <div className="mt-3.5 p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10 space-y-3 text-xs shadow-md">
        <div className="flex items-center justify-between border-b border-blue-500/15 pb-2.5">
          <span className="font-semibold text-foreground dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
            <DollarSign className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
            Purchase Analysis: {data.item_name} (${Number(data.cost).toLocaleString()})
          </span>
          {isExecuted ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Approved & Logged
            </span>
          ) : isRejected ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-muted dark:bg-white/10 text-muted-foreground dark:text-white/40 flex items-center gap-1">
              <XCircle className="h-3 w-3" /> Dismissed
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              Pending Approval
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="p-2.5 rounded-xl bg-background/80 dark:bg-black/40 border border-border/50 dark:border-white/5">
            <span className="text-[10px] text-muted-foreground dark:text-white/50 block">Goal Delay</span>
            <span className="font-semibold text-rose-500 dark:text-rose-400 font-mono">
              +{data.delay_months} months
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-background/80 dark:bg-black/40 border border-border/50 dark:border-white/5">
            <span className="text-[10px] text-muted-foreground dark:text-white/50 block">Post-Buy Progress</span>
            <span className="font-semibold text-foreground dark:text-white font-mono">
              ${Number(data.new_progress).toLocaleString()}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-background/80 dark:bg-black/40 border border-border/50 dark:border-white/5">
            <span className="text-[10px] text-muted-foreground dark:text-white/50 block">5Y Foregone Growth</span>
            <span className="font-semibold text-amber-500 dark:text-amber-400 font-mono">
              -${Number(data.foregone_growth).toLocaleString()}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-background/80 dark:bg-black/40 border border-border/50 dark:border-white/5">
            <span className="text-[10px] text-muted-foreground dark:text-white/50 block">Savings Pace</span>
            <span className="font-semibold text-emerald-500 dark:text-emerald-400 font-mono">
              ${Number(data.monthly_savings).toLocaleString()}/mo
            </span>
          </div>
        </div>

        {!isExecuted && !isRejected && (
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onApprove}
              className="h-8 px-3.5 rounded-xl text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Approve & Record Expense
            </button>
            <button
              type="button"
              onClick={onReject}
              className="h-8 px-3 rounded-xl text-xs text-muted-foreground hover:text-foreground dark:text-white/60 dark:hover:text-white hover:bg-muted dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    );
  }

  // WHAT-IF SCENARIO SIMULATION
  if (action_type === "simulate_what_if") {
    return (
      <div className="mt-3.5 p-4 rounded-2xl border border-purple-500/20 bg-purple-500/5 dark:bg-purple-500/10 space-y-3 text-xs shadow-md">
        <div className="flex items-center justify-between border-b border-purple-500/15 pb-2.5">
          <span className="font-semibold text-foreground dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
            <BrainCircuit className="h-4 w-4 text-purple-500 dark:text-purple-400" />
            What-If Scenario Simulation
          </span>
          {isExecuted ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Applied to Simulator
            </span>
          ) : isRejected ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-muted dark:bg-white/10 text-muted-foreground dark:text-white/40 flex items-center gap-1">
              <XCircle className="h-3 w-3" /> Dismissed
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
              Ready to Apply
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="p-2.5 rounded-xl bg-background/80 dark:bg-black/40 border border-border/50 dark:border-white/5">
            <span className="text-[10px] text-muted-foreground dark:text-white/50 block">Health Index</span>
            <span className="font-semibold font-mono text-foreground dark:text-white">
              {data.baseline_health} ➔ {data.proposed_health}/10
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-background/80 dark:bg-black/40 border border-border/50 dark:border-white/5">
            <span className="text-[10px] text-muted-foreground dark:text-white/50 block">Focus Rating</span>
            <span className="font-semibold font-mono text-foreground dark:text-white">
              {data.baseline_focus} ➔ {data.proposed_focus}/10
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-background/80 dark:bg-black/40 border border-border/50 dark:border-white/5">
            <span className="text-[10px] text-muted-foreground dark:text-white/50 block">5Y Wealth Delta</span>
            <span
              className={`font-semibold font-mono ${
                data.wealth_5y_diff >= 0 ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
              }`}
            >
              {data.wealth_5y_diff >= 0 ? "+" : ""}${Number(data.wealth_5y_diff).toLocaleString()}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-background/80 dark:bg-black/40 border border-border/50 dark:border-white/5">
            <span className="text-[10px] text-muted-foreground dark:text-white/50 block">Retirement</span>
            <span className="font-semibold font-mono text-emerald-500 dark:text-emerald-400">
              {data.attained_retirement ? "On Track" : "Adjust Pace"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          {!isExecuted && !isRejected && (
            <button
              type="button"
              onClick={onApprove}
              className="h-8 px-3.5 rounded-xl text-xs bg-purple-600 hover:bg-purple-500 text-white font-medium flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Approve & Apply to Simulator
            </button>
          )}
          <button
            type="button"
            onClick={() => onNavigate("/simulator")}
            className="h-8 px-3.5 rounded-xl text-xs bg-muted hover:bg-muted/80 dark:bg-white/10 dark:hover:bg-white/15 text-foreground/80 dark:text-white/80 hover:text-foreground dark:hover:text-white flex items-center gap-1 transition-colors border border-border/60 dark:border-white/5 cursor-pointer"
          >
            View in Simulator <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  }

  // WEALTH PROJECTION FORECAST
  if (action_type === "wealth_forecast") {
    return (
      <div className="mt-3.5 p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 space-y-3 text-xs shadow-md">
        <div className="flex items-center justify-between border-b border-emerald-500/15 pb-2.5">
          <span className="font-semibold text-foreground dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
            <TrendingUp className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
            Monte Carlo Wealth Projection
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-mono">
            {data.prob}% Success Odds
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="p-2.5 rounded-xl bg-background/80 dark:bg-black/40 border border-border/50 dark:border-white/5">
            <span className="text-[10px] text-muted-foreground dark:text-white/50 block">P10 Bear Floor</span>
            <span className="font-semibold font-mono text-rose-500 dark:text-rose-400">
              ${Number(data.p10_final).toLocaleString()}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-background/80 dark:bg-black/40 border border-border/50 dark:border-white/5">
            <span className="text-[10px] text-muted-foreground dark:text-white/50 block">Median Outcome</span>
            <span className="font-semibold font-mono text-emerald-500 dark:text-emerald-400">
              ${Number(data.median_final).toLocaleString()}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-background/80 dark:bg-black/40 border border-border/50 dark:border-white/5">
            <span className="text-[10px] text-muted-foreground dark:text-white/50 block">P90 Bull Ceiling</span>
            <span className="font-semibold font-mono text-indigo-500 dark:text-indigo-400">
              ${Number(data.p90_final).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => onNavigate("/wealth")}
            className="h-8 px-3.5 rounded-xl text-xs bg-muted hover:bg-muted/80 dark:bg-white/10 dark:hover:bg-white/15 text-foreground/80 dark:text-white/80 hover:text-foreground dark:hover:text-white flex items-center gap-1 transition-colors border border-border/60 dark:border-white/5 cursor-pointer"
          >
            Open Wealth Engine <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  }

  // PROFILE SETTINGS UPDATE
  if (action_type === "update_settings") {
    return (
      <div className="mt-3.5 p-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 dark:bg-cyan-500/10 space-y-3 text-xs shadow-md">
        <div className="flex items-center justify-between border-b border-cyan-500/15 pb-2.5">
          <span className="font-semibold text-foreground dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
            <Sliders className="h-4 w-4 text-cyan-500 dark:text-cyan-400" />
            Profile & Parameter Updates
          </span>
          {isExecuted ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Applied
            </span>
          ) : isRejected ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-muted dark:bg-white/10 text-muted-foreground dark:text-white/40 flex items-center gap-1">
              <XCircle className="h-3 w-3" /> Dismissed
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              Needs Approval
            </span>
          )}
        </div>

        <div className="space-y-1.5 text-muted-foreground dark:text-white/70">
          {Object.entries(data).map(([key, val]) => (
            <div
              key={key}
              className="flex items-center justify-between p-2 rounded-xl bg-background/80 dark:bg-black/40 border border-border/50 dark:border-white/5"
            >
              <span className="font-mono text-[11px]">{key.replace(/_/g, " ").toUpperCase()}</span>
              <strong className="text-foreground dark:text-white font-mono">{String(val)}</strong>
            </div>
          ))}
        </div>

        {!isExecuted && !isRejected && (
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onApprove}
              className="h-8 px-3.5 rounded-xl text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-medium flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Approve Changes
            </button>
            <button
              type="button"
              onClick={onReject}
              className="h-8 px-3 rounded-xl text-xs text-muted-foreground hover:text-foreground dark:text-white/60 dark:hover:text-white hover:bg-muted dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}
