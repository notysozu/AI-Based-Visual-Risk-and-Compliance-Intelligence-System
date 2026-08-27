import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
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
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
        // Automatically initiate a new thread if no sessions exist
        await handleAutoInitiateThread();
      }
    } catch (err) {
      console.error("Failed to load chat sessions:", err);
      // Fallback: auto-create if error/empty
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
          // If all deleted, automatically initiate a fresh one
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

  return (
    <div className="panel flex flex-col h-[660px] overflow-hidden border border-border/70 shadow-xl bg-card/70 backdrop-blur-2xl rounded-2xl">
      {/* ChatGPT Style Top Navigation Bar */}
      <div className="px-5 py-3.5 border-b border-border/50 flex items-center justify-between bg-sidebar/40">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#0071E3] to-indigo-600 text-white shadow-xs">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm tracking-tight text-foreground">
                Conversational Digital Twin
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                Active Copilot
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground truncate max-w-[220px] sm:max-w-xs">
              {activeSession ? activeSession.title : "Live Simulation Brain"}
            </p>
          </div>
        </div>

        {/* Multi-Session Switcher & Controls */}
        <div className="flex items-center gap-2">
          {/* Thread Switcher Dropdown */}
          <div className="relative">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5 bg-background/80 hover:bg-background"
              onClick={() => setShowSessionsDropdown(!showSessionsDropdown)}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Threads ({sessions.length})</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>

            {showSessionsDropdown && (
              <div className="absolute right-0 mt-1.5 w-64 rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/40 flex items-center justify-between">
                  <span>Past Conversations</span>
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
                      className={`px-3 py-2 text-xs flex items-center justify-between cursor-pointer hover:bg-muted/60 transition-colors ${
                        s.id === activeSessionId ? "bg-[#0071E3]/10 text-[#0071E3] dark:text-blue-400 font-medium" : "text-foreground"
                      }`}
                    >
                      <span className="truncate max-w-[180px]">{s.title}</span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSession(s.id, e)}
                        className="opacity-40 hover:opacity-100 hover:text-rose-500 p-1 transition-opacity"
                        title="Delete conversation"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="p-1.5 border-t border-border/40">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full justify-start text-xs h-7 text-[#0071E3] dark:text-blue-400"
                    onClick={handleCreateSession}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    New Conversation Thread
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Button
            size="sm"
            variant="default"
            className="h-8 text-xs gap-1.5 bg-[#0071E3] hover:bg-[#0071E3]/90 text-white shadow-xs"
            onClick={handleCreateSession}
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New Thread</span>
          </Button>
        </div>
      </div>

      {/* ChatGPT-Style Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {initialLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin text-[#0071E3]" />
            <p className="text-xs">Initializing Digital Twin Intelligence...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 text-muted-foreground p-6">
            <Bot className="h-10 w-10 text-[#0071E3]/50" />
            <div>
              <p className="text-sm font-semibold text-foreground">Digital Twin Ready</p>
              <p className="text-xs mt-1 max-w-sm">
                Ask how financial purchases affect your goals, stress-test lifestyle routines, or schedule tasks with automatic approval.
              </p>
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 text-xs sm:text-sm group ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {/* Assistant Avatar */}
              {m.role !== "user" && (
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-tr from-[#0071E3] to-indigo-600 text-white flex items-center justify-center mt-0.5 shadow-xs">
                  <Sparkles className="h-4 w-4" />
                </div>
              )}

              {/* Message Content Container */}
              <div
                className={`max-w-[90%] sm:max-w-[82%] relative ${
                  m.role === "user"
                    ? "bg-[#0071E3] text-white px-4 py-2.5 rounded-2xl rounded-tr-xs shadow-xs font-normal"
                    : "bg-transparent text-foreground pr-2"
                }`}
              >
                {/* Assistant Markdown Formatter (ChatGPT Style) */}
                {m.role !== "user" ? (
                  <div className="prose-chat text-foreground">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ node, ...props }) => <h1 className="text-base font-bold text-foreground mt-3 mb-1.5" {...props} />,
                        h2: ({ node, ...props }) => <h2 className="text-sm font-bold text-foreground mt-3 mb-1.5" {...props} />,
                        h3: ({ node, ...props }) => <h3 className="text-sm font-semibold text-foreground mt-2.5 mb-1 tracking-tight" {...props} />,
                        h4: ({ node, ...props }) => <h4 className="text-xs font-semibold text-foreground mt-2 mb-1 uppercase tracking-wider font-mono text-muted-foreground" {...props} />,
                        p: ({ node, ...props }) => <p className="leading-relaxed my-1.5 text-xs sm:text-sm" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-4 my-2 space-y-1 text-xs sm:text-sm" {...props} />,
                        ol: ({ node, ...props }) => <ol className="list-decimal list-outside ml-4 my-2 space-y-1 text-xs sm:text-sm" {...props} />,
                        li: ({ node, ...props }) => <li className="leading-relaxed pl-1" {...props} />,
                        strong: ({ node, ...props }) => <strong className="font-semibold text-foreground" {...props} />,
                        blockquote: ({ node, ...props }) => (
                          <blockquote className="border-l-2 border-[#0071E3] bg-[#0071E3]/5 dark:bg-blue-500/10 pl-3 py-1.5 my-2.5 rounded-r-md text-xs sm:text-sm text-foreground/90 font-normal" {...props} />
                        ),
                        code: ({ node, inline, ...props }: any) =>
                          inline ? (
                            <code className="font-mono bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded text-[11px] text-[#0071E3] dark:text-blue-400" {...props} />
                          ) : (
                            <pre className="font-mono bg-black/5 dark:bg-white/5 p-2.5 rounded-lg text-xs overflow-x-auto my-2 border border-border/40"><code {...props} /></pre>
                          )
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>

                    {/* Copy message button on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(m.id, m.content)}
                        className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-1"
                        title="Copy response"
                      >
                        {copiedId === m.id ? (
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
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-[#0071E3]/20 text-[#0071E3] dark:text-blue-400 flex items-center justify-center mt-0.5 shadow-xs">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className="flex gap-3 justify-start items-center text-xs text-muted-foreground animate-pulse">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#0071E3] to-indigo-600 text-white flex items-center justify-center">
              <RefreshCw className="h-4 w-4 animate-spin" />
            </div>
            <span>Running Monte Carlo simulation & computing impact...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestion Pills */}
      <div className="px-4 py-2.5 border-t border-border/30 bg-sidebar/20 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 shrink-0">
          <Sparkles className="h-3 w-3 text-amber-500" /> Prompts:
        </span>
        {QUICK_PROMPTS.map((qp, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(qp)}
            disabled={loading}
            className="text-[11px] px-3 py-1 rounded-full bg-background/80 hover:bg-black/5 dark:hover:bg-white/10 border border-border/50 transition-colors whitespace-nowrap text-muted-foreground hover:text-foreground shrink-0 shadow-2xs"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* ChatGPT-Style Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3.5 border-t border-border/50 bg-sidebar/40 flex items-center gap-2"
      >
        <Input
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          placeholder="Ask anything: 'If I buy a $1,200 laptop...', 'Add a 45 min deep work sprint', 'Run wealth forecast'..."
          className="bg-background/90 h-10 text-xs sm:text-sm border-border/60 focus-visible:ring-1 focus-visible:ring-[#0071E3] rounded-xl shadow-2xs"
          disabled={loading}
        />
        <Button
          type="submit"
          disabled={!inputPrompt.trim() || loading}
          size="sm"
          className="h-10 px-4 bg-[#0071E3] hover:bg-[#0071E3]/90 text-white shrink-0 gap-1.5 rounded-xl shadow-xs"
        >
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">Send</span>
        </Button>
      </form>
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
      <div className="mt-3 p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-3 text-xs shadow-xs">
        <div className="flex items-center justify-between border-b border-blue-500/20 pb-2">
          <span className="font-semibold text-foreground flex items-center gap-1.5 text-xs sm:text-sm">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            Purchase Analysis: {data.item_name} (${Number(data.cost).toLocaleString()})
          </span>
          {isExecuted ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Approved & Logged
            </span>
          ) : isRejected ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-500/15 text-zinc-500 flex items-center gap-1">
              <XCircle className="h-3 w-3" /> Dismissed
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400">
              Pending Approval
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="p-2.5 rounded-lg bg-background/80 border border-border/40">
            <span className="text-[10px] text-muted-foreground block">Goal Delay</span>
            <span className="font-semibold text-rose-500 font-mono">+{data.delay_months} months</span>
          </div>
          <div className="p-2.5 rounded-lg bg-background/80 border border-border/40">
            <span className="text-[10px] text-muted-foreground block">Post-Buy Progress</span>
            <span className="font-semibold text-foreground font-mono">
              ${Number(data.new_progress).toLocaleString()}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-background/80 border border-border/40">
            <span className="text-[10px] text-muted-foreground block">5Y Foregone Growth</span>
            <span className="font-semibold text-amber-500 font-mono">
              -${Number(data.foregone_growth).toLocaleString()}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-background/80 border border-border/40">
            <span className="text-[10px] text-muted-foreground block">Success Odds</span>
            <span className="font-semibold text-emerald-500 font-mono">{data.prob_after}%</span>
          </div>
        </div>

        {!isExecuted && !isRejected && (
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              onClick={onApprove}
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Approve & Record Expense
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onReject}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              Dismiss
            </Button>
          </div>
        )}
      </div>
    );
  }

  // 2. TASK CREATION CARD
  if (action_type === "add_task") {
    return (
      <div className="mt-3 p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 space-y-3 text-xs shadow-xs">
        <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
          <span className="font-semibold text-foreground flex items-center gap-1.5 text-xs sm:text-sm">
            <Clock className="h-4 w-4 text-indigo-500" />
            Schedule Addition: {data.title}
          </span>
          {isExecuted ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Added to Planner
            </span>
          ) : isRejected ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-500/15 text-zinc-500 flex items-center gap-1">
              <XCircle className="h-3 w-3" /> Dismissed
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400">
              Needs Approval
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="p-2.5 rounded-lg bg-background/80 border border-border/40">
            <span className="text-[10px] text-muted-foreground block">Scheduled Time</span>
            <span className="font-semibold text-foreground font-mono">{data.start}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-background/80 border border-border/40">
            <span className="text-[10px] text-muted-foreground block">Duration</span>
            <span className="font-semibold text-foreground font-mono">{data.minutes} mins</span>
          </div>
          <div className="p-2.5 rounded-lg bg-background/80 border border-border/40">
            <span className="text-[10px] text-muted-foreground block">Category</span>
            <span className="font-semibold text-indigo-500">{data.category}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-background/80 border border-border/40">
            <span className="text-[10px] text-muted-foreground block">Impact</span>
            <span className="font-semibold text-emerald-500">{data.impact}</span>
          </div>
        </div>

        {!isExecuted && !isRejected && (
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              onClick={onApprove}
              className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-xs"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Approve & Add Task
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onReject}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              Dismiss
            </Button>
          </div>
        )}
      </div>
    );
  }

  // 3. WHAT-IF SIMULATOR CARD
  if (action_type === "simulate_what_if") {
    return (
      <div className="mt-3 p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-3 text-xs shadow-xs">
        <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
          <span className="font-semibold text-foreground flex items-center gap-1.5 text-xs sm:text-sm">
            <BrainCircuit className="h-4 w-4 text-purple-500" />
            What-If Scenario Simulation
          </span>
          {isExecuted ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Applied to Simulator
            </span>
          ) : isRejected ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-500/15 text-zinc-500 flex items-center gap-1">
              <XCircle className="h-3 w-3" /> Dismissed
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-600 dark:text-purple-400">
              Ready to Apply
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="p-2.5 rounded-lg bg-background/80 border border-border/40">
            <span className="text-[10px] text-muted-foreground block">Health Index</span>
            <span className="font-semibold font-mono">
              {data.baseline_health} ➔ {data.proposed_health}/10
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-background/80 border border-border/40">
            <span className="text-[10px] text-muted-foreground block">Focus Rating</span>
            <span className="font-semibold font-mono">
              {data.baseline_focus} ➔ {data.proposed_focus}/10
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-background/80 border border-border/40">
            <span className="text-[10px] text-muted-foreground block">5Y Wealth Delta</span>
            <span className={`font-semibold font-mono ${data.wealth_5y_diff >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
              {data.wealth_5y_diff >= 0 ? "+" : ""}${Number(data.wealth_5y_diff).toLocaleString()}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-background/80 border border-border/40">
            <span className="text-[10px] text-muted-foreground block">Retirement</span>
            <span className="font-semibold font-mono text-emerald-500">
              {data.attained_retirement ? "On Track" : "Adjust Pace"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          {!isExecuted && !isRejected && (
            <Button
              size="sm"
              onClick={onApprove}
              className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white gap-1.5 shadow-xs"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Approve & Apply to Simulator
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onNavigate("/simulator")}
            className="h-8 text-xs gap-1"
          >
            View in Simulator <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  // 4. WEALTH FORECAST CARD
  if (action_type === "wealth_forecast") {
    return (
      <div className="mt-3 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3 text-xs shadow-xs">
        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
          <span className="font-semibold text-foreground flex items-center gap-1.5 text-xs sm:text-sm">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            Monte Carlo Wealth Projection
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono">
            {data.prob}% Success Odds
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="p-2.5 rounded-lg bg-background/80 border border-border/40">
            <span className="text-[10px] text-muted-foreground block">P10 Bear Floor</span>
            <span className="font-semibold font-mono text-rose-500">${Number(data.p10_final).toLocaleString()}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-background/80 border border-border/40">
            <span className="text-[10px] text-muted-foreground block">Median Outcome</span>
            <span className="font-semibold font-mono text-emerald-500">${Number(data.median_final).toLocaleString()}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-background/80 border border-border/40">
            <span className="text-[10px] text-muted-foreground block">P90 Bull Ceiling</span>
            <span className="font-semibold font-mono text-indigo-500">${Number(data.p90_final).toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onNavigate("/wealth")}
            className="h-8 text-xs gap-1"
          >
            Open Wealth Engine <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  // 5. SETTINGS UPDATE CARD
  if (action_type === "update_settings") {
    return (
      <div className="mt-3 p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 space-y-3 text-xs shadow-xs">
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
          <span className="font-semibold text-foreground flex items-center gap-1.5 text-xs sm:text-sm">
            <Sliders className="h-4 w-4 text-cyan-500" />
            Profile & Parameter Updates
          </span>
          {isExecuted ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Applied
            </span>
          ) : isRejected ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-500/15 text-zinc-500 flex items-center gap-1">
              <XCircle className="h-3 w-3" /> Dismissed
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400">
              Needs Approval
            </span>
          )}
        </div>

        <div className="space-y-1.5 text-muted-foreground">
          {Object.entries(data).map(([key, val]) => (
            <div key={key} className="flex items-center justify-between p-2 rounded bg-background/60 border border-border/40">
              <span className="font-mono text-[11px]">{key.replace(/_/g, " ").toUpperCase()}</span>
              <strong className="text-foreground font-mono">{String(val)}</strong>
            </div>
          ))}
        </div>

        {!isExecuted && !isRejected && (
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              onClick={onApprove}
              className="h-8 text-xs bg-cyan-600 hover:bg-cyan-700 text-white gap-1.5 shadow-xs"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Approve Changes
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onReject}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              Dismiss
            </Button>
          </div>
        )}
      </div>
    );
  }

  return null;
}
