import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Plus,
  Trash2,
  Sparkles,
  Bot,
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
  MessageSquare,
  ChevronDown,
  Copy,
  Check,
  Mic,
  Brain,
  Search,
  AudioWaveform,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import {
  getChatSessions,
  createChatSession,
  deleteChatSession,
  getChatMessages,
  sendChatMessage,
  executeChatAction,
  rejectChatAction,
  type ChatSessionData,
  type ChatMessageData
} from "@/lib/api";
import { useTwin, today } from "@/lib/twin-store";

const QUICK_PROMPTS = [
  "If I buy a $1,200 laptop today, how does that affect my emergency fund goal?",
  "What if I study 5 more hours a week and sleep 30 mins less?",
  "Add a 45 min deep work sprint at 10:00 AM",
  "Run Monte Carlo wealth simulation for my retirement"
];

export function TwinChat() {
  const navigate = useNavigate();
  const { state, addTask, addTxn, updateProfile, saveScenarioPresets } = useTwin();
  const userId = state.profile.id ?? 1;

  const [sessions, setSessions] = useState<ChatSessionData[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showSessionsDropdown, setShowSessionsDropdown] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [isThinkMode, setIsThinkMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load sessions on mount or user change
  useEffect(() => {
    loadSessions();
  }, [userId]);

  // Load messages when active session changes
  useEffect(() => {
    if (activeSessionId) {
      loadMessages(activeSessionId);
    }
  }, [activeSessionId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const loadSessions = async () => {
    try {
      setInitialLoading(true);
      const data = await getChatSessions(userId);
      if (data && data.length > 0) {
        setSessions(data);
        if (!activeSessionId || !data.some((s) => s.id === activeSessionId)) {
          setActiveSessionId(data[0].id);
        }
      } else {
        // Automatically initiate a new thread if none exist
        await handleAutoInitiateThread();
      }
    } catch (err) {
      console.error("Failed to load chat sessions:", err);
      await handleAutoInitiateThread();
    } finally {
      setInitialLoading(false);
    }
  };

  const handleAutoInitiateThread = async () => {
    try {
      const newSession = await createChatSession(userId, { title: "Twin Core Dialogue" });
      setSessions([newSession]);
      setActiveSessionId(newSession.id);
    } catch (e) {
      console.error("Failed to auto-initiate thread:", e);
    }
  };

  const loadMessages = async (sessionId: number) => {
    try {
      const data = await getChatMessages(sessionId);
      setMessages(data);
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  const handleCreateSession = async () => {
    try {
      const newSession = await createChatSession(userId, { title: "New Conversation" });
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      setShowSessionsDropdown(false);
      toast.success("New conversation started");
    } catch (err) {
      toast.error("Failed to create new conversation");
    }
  };

  const handleDeleteSession = async (sessionId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteChatSession(sessionId);
      const updated = sessions.filter((s) => s.id !== sessionId);
      setSessions(updated);
      if (activeSessionId === sessionId) {
        if (updated.length > 0) {
          setActiveSessionId(updated[0].id);
        } else {
          await handleAutoInitiateThread();
        }
      }
      toast.success("Thread deleted");
    } catch (err) {
      toast.error("Failed to delete conversation");
    }
  };

  const handleCopyMessage = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async (customPrompt?: string) => {
    const promptToSend = (customPrompt || inputPrompt).trim();
    if (!promptToSend || !activeSessionId || loading) return;

    setInputPrompt("");
    const optimisticUserMsg: ChatMessageData = {
      id: Date.now(),
      session_id: activeSessionId,
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

      const res = await sendChatMessage(activeSessionId, {
        user_id: Number(userId),
        prompt: promptToSend,
        client_context: clientContext
      });

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticUserMsg.id),
        res.user_message,
        res.assistant_message
      ]);

      // Refresh sessions to reflect updated title
      const updatedSessions = await getChatSessions(userId);
      setSessions(updatedSessions);
    } catch (err: any) {
      toast.error(err.message || "Failed to communicate with Digital Twin AI");
    } finally {
      setLoading(false);
    }
  };

  const handleActionApproval = async (msg: ChatMessageData) => {
    if (!msg.action_payload || !msg.action_type) return;
    try {
      const payload = JSON.parse(msg.action_payload);
      
      // Execute backend DB action
      await executeChatAction(msg.id, {
        user_id: Number(userId),
        action_type: msg.action_type,
        action_payload: payload
      });

      // Synchronize client local state based on action type
      if (msg.action_type === "add_task") {
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

      // Update local message state to executed
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, action_status: "executed" } : m))
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to execute action");
    }
  };

  const handleActionRejection = async (msg: ChatMessageData) => {
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
  const isConversationEmpty = messages.length === 0 || (messages.length === 1 && messages[0].role === "assistant" && messages[0].content.includes("New conversation thread started"));

  return (
    <div className="flex flex-col h-[650px] overflow-hidden rounded-3xl border border-white/10 dark:border-white/10 bg-[#171717]/95 dark:bg-[#171717]/95 text-white shadow-2xl backdrop-blur-2xl transition-all">
      {/* Top Subtle Header Bar */}
      <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between bg-black/20">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-[#0071E3]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-xs tracking-tight text-white/90">
              Digital Twin AI
            </span>
            <span className="text-white/30 text-xs">•</span>
            <span className="text-[11px] text-white/60 truncate max-w-[200px] sm:max-w-xs">
              {activeSession ? activeSession.title : "New Thread"}
            </span>
          </div>
        </div>

        {/* Multi-Session Switcher & Controls */}
        <div className="flex items-center gap-2">
          {/* Thread Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              className="h-7 px-2.5 rounded-lg text-xs flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white/80 border border-white/5 transition-colors"
              onClick={() => setShowSessionsDropdown(!showSessionsDropdown)}
            >
              <MessageSquare className="h-3 w-3 opacity-70" />
              <span className="hidden sm:inline">Threads ({sessions.length})</span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </button>

            {showSessionsDropdown && (
              <div className="absolute right-0 mt-1.5 w-64 rounded-2xl border border-white/10 bg-[#212121] shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3.5 py-1 text-[10px] font-semibold text-white/40 uppercase tracking-wider border-b border-white/5 flex items-center justify-between">
                  <span>Conversations</span>
                  <span className="font-mono">{sessions.length} saved</span>
                </div>
                <div className="max-h-56 overflow-y-auto py-1 space-y-0.5">
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        setActiveSessionId(s.id);
                        setShowSessionsDropdown(false);
                      }}
                      className={`px-3.5 py-2 text-xs flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors ${
                        s.id === activeSessionId ? "bg-white/10 text-white font-medium" : "text-white/70"
                      }`}
                    >
                      <span className="truncate max-w-[170px]">{s.title}</span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSession(s.id, e)}
                        className="opacity-40 hover:opacity-100 hover:text-rose-400 p-1 transition-opacity"
                        title="Delete thread"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="p-1.5 border-t border-white/5">
                  <button
                    type="button"
                    className="w-full py-1.5 px-3 rounded-lg text-xs flex items-center text-[#0071E3] hover:bg-white/5 transition-colors"
                    onClick={handleCreateSession}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    New Conversation
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            className="h-7 px-2.5 rounded-lg text-xs flex items-center gap-1 bg-white/5 hover:bg-white/10 text-white/80 border border-white/5 transition-colors"
            onClick={handleCreateSession}
            title="Start new thread"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New</span>
          </button>
        </div>
      </div>

      {/* Main Messages & Empty State Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {initialLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 text-white/50">
            <RefreshCw className="h-6 w-6 animate-spin text-[#0071E3]" />
            <p className="text-xs">Connecting to Digital Twin...</p>
          </div>
        ) : isConversationEmpty ? (
          /* ChatGPT Style Centered Hero / Greeting */
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 px-4">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-white/95">
                What’s on the agenda today?
              </h2>
              <p className="text-xs text-white/50 max-w-md mx-auto">
                Ask about financial decisions, run life simulations, or optimize your daily routine.
              </p>
            </div>

            {/* Quick Prompt Pills in Center */}
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl">
              {QUICK_PROMPTS.map((qp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(qp)}
                  disabled={loading}
                  className="text-xs px-3.5 py-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-all text-left max-w-xs shadow-xs"
                >
                  {qp}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3.5 text-xs sm:text-sm group ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {/* Assistant Minimalist Sparkle Avatar */}
              {m.role !== "user" && (
                <div className="flex-shrink-0 h-7 w-7 rounded-full bg-white/10 border border-white/10 text-[#0071E3] flex items-center justify-center mt-0.5">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
              )}

              {/* Message Bubble Container */}
              <div
                className={`max-w-[90%] sm:max-w-[82%] relative ${
                  m.role === "user"
                    ? "bg-[#2f2f2f] text-white px-4 py-2.5 rounded-3xl rounded-tr-xs shadow-xs text-sm"
                    : "bg-transparent text-white/90 pr-2"
                }`}
              >
                {/* Assistant Markdown Formatter (ChatGPT Style) */}
                {m.role !== "user" ? (
                  <div className="prose-chat leading-relaxed space-y-2">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ node, ...props }) => <h1 className="text-base font-semibold text-white mt-3 mb-1.5" {...props} />,
                        h2: ({ node, ...props }) => <h2 className="text-sm font-semibold text-white mt-3 mb-1.5" {...props} />,
                        h3: ({ node, ...props }) => <h3 className="text-sm font-semibold text-white mt-2.5 mb-1 tracking-tight" {...props} />,
                        h4: ({ node, ...props }) => <h4 className="text-xs font-semibold text-white/70 mt-2 mb-1 uppercase tracking-wider font-mono" {...props} />,
                        p: ({ node, ...props }) => <p className="leading-relaxed my-1 text-xs sm:text-sm text-white/90" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-4 my-2 space-y-1 text-xs sm:text-sm text-white/90" {...props} />,
                        ol: ({ node, ...props }) => <ol className="list-decimal list-outside ml-4 my-2 space-y-1 text-xs sm:text-sm text-white/90" {...props} />,
                        li: ({ node, ...props }) => <li className="leading-relaxed pl-1" {...props} />,
                        strong: ({ node, ...props }) => <strong className="font-semibold text-white" {...props} />,
                        blockquote: ({ node, ...props }) => (
                          <blockquote className="border-l-2 border-[#0071E3] bg-white/5 pl-3 py-1.5 my-2.5 rounded-r text-xs sm:text-sm text-white/80 font-normal italic" {...props} />
                        ),
                        code: ({ node, inline, ...props }: any) =>
                          inline ? (
                            <code className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-[11px] text-[#0071E3]" {...props} />
                          ) : (
                            <pre className="font-mono bg-black/40 p-3 rounded-xl text-xs overflow-x-auto my-2 border border-white/10 text-white/90"><code {...props} /></pre>
                          )
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>

                    {/* Copy message button on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 mt-2 text-[11px] text-white/40">
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(m.id, m.content)}
                        className="p-1 rounded hover:bg-white/10 transition-colors flex items-center gap-1"
                        title="Copy response"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
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
                ) : (
                  <div className="leading-relaxed whitespace-pre-wrap">{m.content}</div>
                )}

                {/* Interactive Action Proposal Cards */}
                {m.action_payload && m.action_type && m.action_type !== "none" && (
                  <InteractiveActionCard
                    message={m}
                    onApprove={() => handleActionApproval(m)}
                    onReject={() => handleActionRejection(m)}
                    onNavigate={(path) => navigate({ to: path })}
                  />
                )}
              </div>

              {/* User Avatar */}
              {m.role === "user" && (
                <div className="flex-shrink-0 h-7 w-7 rounded-full bg-white/10 text-white/80 flex items-center justify-center mt-0.5">
                  <User className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className="flex gap-3.5 justify-start items-center text-xs text-white/60 animate-pulse">
            <div className="h-7 w-7 rounded-full bg-white/10 text-[#0071E3] flex items-center justify-center">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            </div>
            <span>Analyzing Digital Twin & computing simulation...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ChatGPT Style Floating Input Pill Bar */}
      <div className="p-4 sm:p-5 pt-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative rounded-full bg-[#212121] border border-white/15 px-3 py-2 flex items-center gap-2 shadow-2xl hover:border-white/25 transition-all focus-within:border-white/40 focus-within:ring-1 focus-within:ring-white/10"
        >
          {/* Plus icon on the left */}
          <button
            type="button"
            onClick={handleCreateSession}
            className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors shrink-0"
            title="New Conversation"
          >
            <Plus className="h-4 w-4" />
          </button>

          {/* Clean Input */}
          <input
            ref={inputRef}
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Ask anything"
            disabled={loading}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none px-1"
          />

          {/* Right Tools: Think Pill + Mic + Signature Blue Action Button */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Think toggle button */}
            <button
              type="button"
              onClick={() => setIsThinkMode(!isThinkMode)}
              className={`h-7 px-2.5 rounded-full text-[11px] font-medium flex items-center gap-1 transition-colors ${
                isThinkMode
                  ? "bg-[#0071E3]/20 text-[#0071E3] border border-[#0071E3]/40"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
              }`}
              title="Reasoning Simulation Mode"
            >
              <Brain className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Think</span>
            </button>

            {/* Mic / Voice icon */}
            <button
              type="button"
              onClick={() => toast.info("Voice input ready on supported browsers")}
              className="h-7 w-7 rounded-full text-white/50 hover:text-white/80 hover:bg-white/5 flex items-center justify-center transition-colors"
              title="Voice Input"
            >
              <Mic className="h-4 w-4" />
            </button>

            {/* Blue Circular Waveform / Send Button */}
            <button
              type="submit"
              disabled={!inputPrompt.trim() || loading}
              className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${
                inputPrompt.trim() && !loading
                  ? "bg-[#0071E3] hover:bg-[#0071E3]/90 text-white shadow-md cursor-pointer active:scale-95"
                  : "bg-white/10 text-white/30 cursor-not-allowed"
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
  );
}

// -----------------------------------------------------------------------------
// Interactive Action Card Component with User Approval Flow
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

  // 1. PURCHASE IMPACT CARD
  if (action_type === "purchase_impact") {
    return (
      <div className="mt-3.5 p-4 rounded-2xl border border-white/10 bg-white/5 space-y-3 text-xs shadow-lg">
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <span className="font-medium text-white flex items-center gap-1.5 text-xs sm:text-sm">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            Purchase Analysis: {data.item_name} (${Number(data.cost).toLocaleString()})
          </span>
          {isExecuted ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Approved & Logged
            </span>
          ) : isRejected ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white/40 flex items-center gap-1">
              <XCircle className="h-3 w-3" /> Dismissed
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Pending Approval
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
            <span className="text-[10px] text-white/50 block">Goal Delay</span>
            <span className="font-semibold text-rose-400 font-mono">+{data.delay_months} months</span>
          </div>
          <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
            <span className="text-[10px] text-white/50 block">Post-Buy Progress</span>
            <span className="font-semibold text-white font-mono">
              ${Number(data.new_progress).toLocaleString()}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
            <span className="text-[10px] text-white/50 block">5Y Foregone Growth</span>
            <span className="font-semibold text-amber-400 font-mono">
              -${Number(data.foregone_growth).toLocaleString()}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
            <span className="text-[10px] text-white/50 block">Success Odds</span>
            <span className="font-semibold text-emerald-400 font-mono">{data.prob_after}%</span>
          </div>
        </div>

        {!isExecuted && !isRejected && (
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onApprove}
              className="h-8 px-3 rounded-xl text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1.5 shadow-md transition-all active:scale-95"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Approve & Record Expense
            </button>
            <button
              type="button"
              onClick={onReject}
              className="h-8 px-3 rounded-xl text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    );
  }

  // 2. TASK CREATION CARD
  if (action_type === "add_task") {
    return (
      <div className="mt-3.5 p-4 rounded-2xl border border-white/10 bg-white/5 space-y-3 text-xs shadow-lg">
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <span className="font-medium text-white flex items-center gap-1.5 text-xs sm:text-sm">
            <Clock className="h-4 w-4 text-[#0071E3]" />
            Schedule Addition: {data.title}
          </span>
          {isExecuted ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Added to Planner
            </span>
          ) : isRejected ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white/40 flex items-center gap-1">
              <XCircle className="h-3 w-3" /> Dismissed
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Needs Approval
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
            <span className="text-[10px] text-white/50 block">Scheduled Time</span>
            <span className="font-semibold text-white font-mono">{data.start}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
            <span className="text-[10px] text-white/50 block">Duration</span>
            <span className="font-semibold text-white font-mono">{data.minutes} mins</span>
          </div>
          <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
            <span className="text-[10px] text-white/50 block">Category</span>
            <span className="font-semibold text-[#0071E3]">{data.category}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
            <span className="text-[10px] text-white/50 block">Impact</span>
            <span className="font-semibold text-emerald-400">{data.impact}</span>
          </div>
        </div>

        {!isExecuted && !isRejected && (
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onApprove}
              className="h-8 px-3 rounded-xl text-xs bg-[#0071E3] hover:bg-[#0071E3]/90 text-white font-medium flex items-center gap-1.5 shadow-md transition-all active:scale-95"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Approve & Add Task
            </button>
            <button
              type="button"
              onClick={onReject}
              className="h-8 px-3 rounded-xl text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    );
  }

  // 3. WHAT-IF SIMULATOR CARD
  if (action_type === "simulate_what_if") {
    return (
      <div className="mt-3.5 p-4 rounded-2xl border border-white/10 bg-white/5 space-y-3 text-xs shadow-lg">
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <span className="font-medium text-white flex items-center gap-1.5 text-xs sm:text-sm">
            <BrainCircuit className="h-4 w-4 text-purple-400" />
            What-If Scenario Simulation
          </span>
          {isExecuted ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Applied to Simulator
            </span>
          ) : isRejected ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white/40 flex items-center gap-1">
              <XCircle className="h-3 w-3" /> Dismissed
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Ready to Apply
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
            <span className="text-[10px] text-white/50 block">Health Index</span>
            <span className="font-semibold font-mono text-white">
              {data.baseline_health} ➔ {data.proposed_health}/10
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
            <span className="text-[10px] text-white/50 block">Focus Rating</span>
            <span className="font-semibold font-mono text-white">
              {data.baseline_focus} ➔ {data.proposed_focus}/10
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
            <span className="text-[10px] text-white/50 block">5Y Wealth Delta</span>
            <span className={`font-semibold font-mono ${data.wealth_5y_diff >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {data.wealth_5y_diff >= 0 ? "+" : ""}${Number(data.wealth_5y_diff).toLocaleString()}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
            <span className="text-[10px] text-white/50 block">Retirement</span>
            <span className="font-semibold font-mono text-emerald-400">
              {data.attained_retirement ? "On Track" : "Adjust Pace"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          {!isExecuted && !isRejected && (
            <button
              type="button"
              onClick={onApprove}
              className="h-8 px-3 rounded-xl text-xs bg-purple-600 hover:bg-purple-500 text-white font-medium flex items-center gap-1.5 shadow-md transition-all active:scale-95"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Approve & Apply to Simulator
            </button>
          )}
          <button
            type="button"
            onClick={() => onNavigate("/simulator")}
            className="h-8 px-3 rounded-xl text-xs bg-white/10 hover:bg-white/15 text-white/80 hover:text-white flex items-center gap-1 transition-colors"
          >
            View in Simulator <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  }

  // 4. WEALTH FORECAST CARD
  if (action_type === "wealth_forecast") {
    return (
      <div className="mt-3.5 p-4 rounded-2xl border border-white/10 bg-white/5 space-y-3 text-xs shadow-lg">
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <span className="font-medium text-white flex items-center gap-1.5 text-xs sm:text-sm">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            Monte Carlo Wealth Projection
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
            {data.prob}% Success Odds
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
            <span className="text-[10px] text-white/50 block">P10 Bear Floor</span>
            <span className="font-semibold font-mono text-rose-400">${Number(data.p10_final).toLocaleString()}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
            <span className="text-[10px] text-white/50 block">Median Outcome</span>
            <span className="font-semibold font-mono text-emerald-400">${Number(data.median_final).toLocaleString()}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
            <span className="text-[10px] text-white/50 block">P90 Bull Ceiling</span>
            <span className="font-semibold font-mono text-indigo-400">${Number(data.p90_final).toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => onNavigate("/wealth")}
            className="h-8 px-3 rounded-xl text-xs bg-white/10 hover:bg-white/15 text-white/80 hover:text-white flex items-center gap-1 transition-colors"
          >
            Open Wealth Engine <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  }

  // 5. SETTINGS UPDATE CARD
  if (action_type === "update_settings") {
    return (
      <div className="mt-3.5 p-4 rounded-2xl border border-white/10 bg-white/5 space-y-3 text-xs shadow-lg">
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <span className="font-medium text-white flex items-center gap-1.5 text-xs sm:text-sm">
            <Sliders className="h-4 w-4 text-cyan-400" />
            Profile & Parameter Updates
          </span>
          {isExecuted ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Applied
            </span>
          ) : isRejected ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white/40 flex items-center gap-1">
              <XCircle className="h-3 w-3" /> Dismissed
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Needs Approval
            </span>
          )}
        </div>

        <div className="space-y-1.5 text-white/70">
          {Object.entries(data).map(([key, val]) => (
            <div key={key} className="flex items-center justify-between p-2 rounded-xl bg-black/30 border border-white/5">
              <span className="font-mono text-[11px]">{key.replace(/_/g, " ").toUpperCase()}</span>
              <strong className="text-white font-mono">{String(val)}</strong>
            </div>
          ))}
        </div>

        {!isExecuted && !isRejected && (
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onApprove}
              className="h-8 px-3 rounded-xl text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-medium flex items-center gap-1.5 shadow-md transition-all active:scale-95"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Approve Changes
            </button>
            <button
              type="button"
              onClick={onReject}
              className="h-8 px-3 rounded-xl text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors"
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
